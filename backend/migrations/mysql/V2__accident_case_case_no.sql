ALTER TABLE accident_cases
  ADD COLUMN case_no VARCHAR(50) NULL,
  ADD COLUMN unit_name VARCHAR(256) NULL,
  ADD COLUMN occurred_year INT NULL;

CREATE INDEX idx_accident_cases_case_no ON accident_cases(case_no);
CREATE INDEX idx_accident_cases_unit_name ON accident_cases(unit_name);
CREATE INDEX idx_accident_cases_occurred_year ON accident_cases(occurred_year);

ALTER TABLE accident_cases
  ADD CONSTRAINT uq_accident_case_no_unit_year UNIQUE (unit_name, occurred_year, case_no);

