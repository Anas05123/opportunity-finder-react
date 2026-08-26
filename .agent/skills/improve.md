# shadcn/improve Skill Integration

The installed `improve` skill is a senior-advisor audit and planning skill.

## Use It When

- auditing Careerly for bugs, security, performance, tests, architecture, DX, dependencies, docs, or roadmap opportunities;
- creating prioritized implementation plans for other agents;
- reviewing and tightening existing plans;
- reconciling completed or blocked plans.

## Do Not Use It When

- directly editing source code;
- fixing a bug immediately;
- implementing a feature;
- running formatters or commands that mutate the working tree;
- replacing the execution responsibility of `backend_agent`, `frontend_agent`, `security_agent`, or another implementation agent.

## Output Contract

Plans written by this skill must be self-contained enough for a separate execution agent with no session memory. They must include:

- problem and evidence;
- exact files in scope and out of scope;
- implementation steps;
- verification gates;
- done criteria;
- rollback or stop conditions.

## Careerly Rule

The improve skill may create or update files under `plans/` only. It may read source code and docs, but it must not implement source changes itself.
