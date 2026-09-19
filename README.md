# LinkedIn Jobs for n8n

Search current LinkedIn job listings and turn hiring activity into structured research or sales signals. Results can include role, company, location, salary, skills, seniority, freshness, benefits and a recruiter-oriented score.

## Install

In n8n, open **Settings → Community Nodes → Install** and enter `n8n-nodes-apivault-linkedin-jobs`. Add an **Apify API** credential, then select it in the node.

## Quickstart

Import [`examples/quickstart-workflow.json`](examples/quickstart-workflow.json), replace the sample keyword and location, select your credential, and run the workflow. The final node returns a clean hiring-signal summary ready for a CRM, sheet, database or alert.

## Useful workflows

- monitor new roles in a market;
- find companies with active hiring demand;
- build salary and skill reports;
- prepare a reviewed outreach queue.

Runs use the hosted [LinkedIn Jobs Scraper](https://apify.com/apivault_labs/linkedin-jobs-scraper). Actor usage is billed separately on Apify.

## License

[MIT](LICENSE)
