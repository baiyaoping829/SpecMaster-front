ALTER TABLE accident_cases ADD COLUMN case_no TEXT;
ALTER TABLE accident_cases ADD COLUMN unit_name TEXT;
ALTER TABLE accident_cases ADD COLUMN occurred_year INTEGER;

CREATE INDEX IF NOT EXISTS idx_accident_cases_case_no ON accident_cases(case_no);
CREATE INDEX IF NOT EXISTS idx_accident_cases_unit_name ON accident_cases(unit_name);
CREATE INDEX IF NOT EXISTS idx_accident_cases_occurred_year ON accident_cases(occurred_year);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accident_case_no_unit_year ON accident_cases(unit_name, occurred_year, case_no);

