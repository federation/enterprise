CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA enterprise;

CREATE TABLE enterprise.account (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    name TEXT,
    email TEXT,
    password TEXT,
    refresh_token TEXT
);

CREATE TABLE enterprise.employer (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    name TEXT NOT NULL,
    location TEXT,
    url TEXT,

    notes TEXT
);

-- Additional information about an employer.
-- Examples: urls for glassdoor, stackshare, indeed, experiences, comments.
CREATE TABLE enterprise.employer_resource (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    employer UUID REFERENCES enterprise.employer,

    url TEXT
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
  post_body TEXT,
  post_url TEXT,
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
