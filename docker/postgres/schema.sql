-- CREATE USER admin;
CREATE DATABASE federation;
-- GRANT ALL PRIVILEGES ON DATABASE federation TO admin;

\connect federation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA enterprise;

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
  password TEXT NOT NULL,

  -- A JSON Web Token representation of the user's refresh token.
  -- TODO
  -- Should this be unique?
  refresh_token TEXT
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
CREATE TABLE enterprise.employer_notes (
  employer_notes_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

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

  -- The notes.
  -- Prevent it being NULL, otherwise what's the point of the row existing.
  notes TEXT NOT NULL
);

-- TODO
-- The only real difference between this and employer_notes is a notes vs url field.
-- Should this be done a different way?

-- Additional information about an employer.
-- Examples: urls for glassdoor, stackshare, indeed, experiences, comments.
CREATE TABLE enterprise.employer_notes_resource (
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
-- * Inactive: saved but not actively pursued
-- * Researching: researching the company, role
-- * Preparing: preparing the submission documents
-- * Applied: documents have been submitted
-- * Engaged: the employer initiated the hiring process
-- * Concluded: the opportunity has been followed through to its conclusion
-- TODO: on each status change, require a journal entry?
CREATE TYPE enterprise.opportunity_status AS ENUM (
  'inactive',
  'researching',
  'preparing',
  'applied',
  'engaged',
  'concluded'
);

-- The result of an active opportunity.
-- * Pending: the conclusion has not been reached
-- * Ignored: the submission was not followed up
-- * Deferred: the applicant concluded it
-- * Rejected: the target concluded it
-- * Offered: an offer was extended
-- TODO: on each result change, require a journal entry?
CREATE TYPE enterprise.opportunity_result AS ENUM (
  'pending',
  'ignored',
  'deferred',
  'rejected',
  'offered'
);

-- An opportunity.
CREATE TABLE enterprise.opportunity (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  employer UUID REFERENCES enterprise.employer,

  -- TODO
  -- Changing either of these should be done within a transaction which also
  -- creates an entry in opportunity_event.
  status enterprise.opportunity_status NOT NULL,
  result enterprise.opportunity_result NOT NULL,

  role TEXT,
  location TEXT,
  remote BOOLEAN,
  salary_range NUMRANGE,
  body TEXT,
  url TEXT,
  technologies TEXT,

  notes TEXT,

  -- If the opportunity has concluded, the result must not remain pending.
  CONSTRAINT valid_result CHECK (NOT (status = 'concluded' AND result = 'pending'))
);

-- Opportunity-related contact.
-- Feature: when receiving a call, quickly input number into auto-complete search,
-- which will find the associated contact and pull up the associated opportunity,
-- name, and other notes.
-- TODO: Should this be associated with an employer instead?
CREATE TABLE enterprise.opportunity_contact (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  opportunity UUID REFERENCES enterprise.opportunity,

  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT
);

-- Opportunity-related, time-stamped journal entry.
-- Examples: describing latest development, communication, etc.
CREATE TABLE enterprise.opportunity_journal (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  opportunity UUID REFERENCES enterprise.opportunity,

  content TEXT NOT NULL
);

-- Opportunity-related event.
-- Examples: phone-screen datetime, onsite datetime, submission deadline.
CREATE TABLE enterprise.opportunity_event (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  opportunity UUID REFERENCES enterprise.opportunity,

  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  location TEXT -- TODO: handle remote
);

-- Opportunity-related resource url.
-- Examples: topic to learn, interview experience, practice problem.
-- TODO:
-- * differentiate between categories?
CREATE TABLE enterprise.opportunity_resource (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  opportunity UUID REFERENCES enterprise.opportunity,

  url TEXT
);

-- Opportunity-related comment.
-- TODO:
-- * embed in database, or foreign reference?
-- * differentiate between created and given?
CREATE TABLE enterprise.opportunity_document (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  name TEXT NOT NULL,
  encoding TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  description TEXT,

  content bytea,
  foreign_content TEXT
);
