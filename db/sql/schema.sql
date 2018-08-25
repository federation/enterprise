-- CREATE USER admin;
CREATE DATABASE federation;
-- GRANT ALL PRIVILEGES ON DATABASE federation TO admin;

\connect federation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA enterprise;

CREATE FUNCTION to_iso8601(ts timestamp with time zone) RETURNS text AS $$
  SELECT to_char(ts at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
$$ LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE;

-- A user account.
CREATE TABLE enterprise.account (
  account_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The username.
  name TEXT UNIQUE NOT NULL,

  -- The user's email address.
  email TEXT NOT NULL,

  -- The user's Argon2 password hash.
  -- Computed as Argon2(Base64(SHA512(plain)))
  password TEXT NOT NULL
);

-- An employer.
CREATE TABLE enterprise.employer (
  employer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The name of the employer.
  name TEXT NOT NULL,

  -- The employer's Headquarters.
  location TEXT,

  -- Whether the company is known to do remote.
  remote BOOLEAN DEFAULT FALSE NOT NULL,

  -- The employer's website.
  url TEXT
);

-- User-created notes about an employer.
CREATE TABLE enterprise.employer_user_notes (
  PRIMARY KEY (employer_id, account_id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The user the notes are by.
  account_id UUID NOT NULL REFERENCES enterprise.account
                           ON DELETE CASCADE
                           ON UPDATE CASCADE,

  -- The employer the notes are about.
  employer_id UUID NOT NULL REFERENCES enterprise.employer
                            ON DELETE CASCADE
                            ON UPDATE CASCADE,

  -- The notes.
  -- Prevent it being NULL, otherwise what's the point of the row existing.
  notes TEXT NOT NULL
);

-- TODO: The only real difference between this and employer_notes is a notes vs
-- url field. Should this be done a different way?

-- Additional information about an employer.
-- Examples: urls for glassdoor, stackshare, indeed, experiences, comments.
CREATE TABLE enterprise.employer_user_resource (
  employer_notes_resource_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The user the notes are by.
  account_id UUID NOT NULL REFERENCES enterprise.account
                           ON DELETE CASCADE
                           ON UPDATE CASCADE,

  -- The employer the notes are about.
  employer_id UUID NOT NULL REFERENCES enterprise.employer
                            ON DELETE CASCADE
                            ON UPDATE CASCADE,

  UNIQUE (employer_id, account_id),

  -- The resource.
  -- Prevent it being NULL, otherwise what's the point of the row existing.
  url TEXT NOT NULL
);

-- The status of an active opportunity.
-- TODO: on each status change, require a journal entry?
CREATE TYPE enterprise.opportunity_status AS ENUM (
  -- Opportunity is saved but not being actively pursued.
  'inactive',

  -- Researching the company, role.
  'researching',

  -- Preparing the submission documents.
  'preparing',

  -- Documents have been submitted.
  'applied',

  -- The employer initiated the hiring process.
  'engaged',

  -- The opportunity has been followed through to its conclusion.
  'concluded'
);

-- The result of an active opportunity.
-- TODO: on each result change, require a journal entry?
CREATE TYPE enterprise.opportunity_result AS ENUM (
  -- The conclusion has not been reached.
  'pending',

  -- The submission was not followed up.
  'ignored',

  -- The applicant withdrew.
  'withdrew',

  -- The employer concluded it.
  'rejected',

  -- An offer was extended.
  'offered'
);

-- An opportunity.
CREATE TABLE enterprise.opportunity (
  opportunity_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The employer the opportunity comes from.
  employer_id UUID NOT NULL REFERENCES enterprise.employer
                            ON DELETE CASCADE
                            ON UPDATE CASCADE,

  account_id UUID NOT NULL REFERENCES enterprise.account
                           ON DELETE CASCADE
                           ON UPDATE CASCADE,

  -- TODO: Changing either of these should be done within a transaction which
  -- also creates an entry in opportunity_event.

  -- TODO: Should these be a lookup table instead of an enum?

  -- The status of the opportunity.
  status enterprise.opportunity_status NOT NULL,

  -- The result of an opportunity.
  result enterprise.opportunity_result NOT NULL,

  -- The result must not remain pending if the opportunity has concluded.
  CONSTRAINT valid_result
  CHECK (NOT (status = 'concluded' AND result = 'pending')),

  -- The job title.
  title TEXT NOT NULL,

  -- The location of the role.
  location TEXT,

  -- Whether the role accepts remote.
  remote BOOLEAN DEFAULT FALSE NOT NULL,

  -- The advertised salary range.
  salary_range NUMRANGE CONSTRAINT positive_salary
                        CHECK (salary_range IS NULL OR lower(salary_range) >= 0),

  -- The job post body.
  body TEXT,

  -- The url of the job post.
  url TEXT,

  -- The list of technologies.
  -- TODO: Should this be normalized in a separate table?
  technologies TEXT[],

  -- Notes about the opportunity.
  notes TEXT
);

-- Opportunity-related contact.
-- Feature: when receiving a call, quickly input number into auto-complete search,
-- which will find the associated contact and pull up the associated opportunity,
-- name, and other notes.
-- TODO: Should this be associated with an employer instead?
CREATE TABLE enterprise.opportunity_contact (
  opportunity_contact_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The opportunity this contact information pertains to.
  opportunity_id UUID REFERENCES enterprise.opportunity
                      ON DELETE CASCADE
                      ON UPDATE CASCADE,

  -- The name of the contact.
  name TEXT NOT NULL,

  -- The phone number of the contact.
  phone TEXT,

  -- The email address of the contact.
  email TEXT,

  -- Notes about the contact.
  notes TEXT
);

-- Opportunity-related, time-stamped journal entry.
-- Examples: describing latest development, communication, etc.
CREATE TABLE enterprise.opportunity_journal_entry (
  opportunity_journal_entry_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The opportunity the journal entry pertains to.
  opportunity_id UUID REFERENCES enterprise.opportunity
                      ON DELETE CASCADE
                      ON UPDATE CASCADE,

  -- The journal entry's body.
  body TEXT NOT NULL
);

-- Opportunity-related event.
-- Examples: phone-screen datetime, onsite datetime, submission deadline.
CREATE TABLE enterprise.opportunity_event (
  opportunity_event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The opportunity the event relates to.
  opportunity_id UUID REFERENCES enterprise.opportunity
                      ON DELETE CASCADE
                      ON UPDATE CASCADE,

  -- The datetime when the event begins.
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- The datetime when the event ends.
  -- A NULL end_date means it's an all-day event.
  end_date TIMESTAMP WITH TIME ZONE,

  -- The description of the event.
  description TEXT NOT NULL,

  -- The location of the event.
  location TEXT
);

-- Opportunity-related resource url.
-- Examples: topic to learn, interview experience, practice problem.
-- TODO: differentiate between categories?
CREATE TABLE enterprise.opportunity_resource (
  opportunity_resource_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The opportunity the resource pertains to.
  opportunity_id UUID REFERENCES enterprise.opportunity
                      ON DELETE CASCADE
                      ON UPDATE CASCADE,

  -- The url of the resource.
  url TEXT NOT NULL
);

-- Opportunity-related comment.
-- TODO: If a document is just a url, that could just be part of opportunity_resource?
-- The only differentiation is that we would know that it's a document? So it
-- could be shown in a different 'documents' section?
CREATE TABLE enterprise.opportunity_document (
  opportunity_document_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- The opportunity the document belongs to.
  opportunity_id UUID REFERENCES enterprise.opportunity
                      ON DELETE CASCADE
                      ON UPDATE CASCADE,

  -- The document's file name..
  name TEXT NOT NULL,

  -- The document's encoding.
  encoding TEXT,

  -- The document's mime type.
  mime_type TEXT,

  -- The document's description.
  description TEXT,

  -- The document's binary content.
  content bytea,

  CONSTRAINT valid_document_mime_type
  CHECK (content IS NULL OR mime_type IS NOT NULL),

  CONSTRAINT valid_document_encoding
  CHECK (content IS NULL OR encoding IS NOT NULL),

  -- The document's url.
  url TEXT,

  CONSTRAINT document_exists
  CHECK (content IS NOT NULL OR url IS NOT NULL)
);
