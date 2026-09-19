import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const ACTOR_ID = 'apivault_labs~linkedin-jobs-scraper';

export class LinkedinJobs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LinkedIn Jobs Scraper',
		name: 'linkedinJobs',
		icon: 'file:linkedinjobs.svg',
		group: ['transform'],
		version: 1,
		description: 'Scrape LinkedIn Jobs in real-time + 15 layers of recruitment intelligence: salary parser (USD-normalized + tier), location parser (city/state/country), job freshness, work-mode classifier, 200+ skills, benefits parser, seniority normalizer, category auto-detect, apply-method (easy_apply/external), D',
		defaults: { name: 'LinkedIn Jobs Scraper' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'apifyApi', required: true }],
		properties: [
   {
      "displayName": "Job Keywords",
      "name": "keywords",
      "description": "Job title or keywords. Examples: 'software engineer', 'marketing manager'.",
      "type": "string",
      "default": "",
      "required": true
   },
   {
      "displayName": "Location",
      "name": "location",
      "description": "City, state, country, or 'Remote'. Examples: 'New York', 'United States', 'Remote'.",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Pages to scrape",
      "name": "maxPages",
      "description": "Number of result pages to scrape (each ~60 jobs). Direct fetch: ~1.5s/page.",
      "type": "number",
      "default": 5,
      "typeOptions": {
         "minValue": 1,
         "maxValue": 40
      }
   },
   {
      "displayName": "Remote-only (LinkedIn filter)",
      "name": "remote",
      "description": "Filter to remote jobs only via LinkedIn's own f_WT=2 query parameter",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Experience Level",
      "name": "experienceLevel",
      "description": "Filter by required experience",
      "type": "options",
      "options": [
         {
            "name": "Any (default)",
            "value": "any"
         },
         {
            "name": "Internship",
            "value": "internship"
         },
         {
            "name": "Entry level",
            "value": "entry"
         },
         {
            "name": "Associate",
            "value": "associate"
         },
         {
            "name": "Mid-Senior level",
            "value": "mid_senior"
         },
         {
            "name": "Director",
            "value": "director"
         },
         {
            "name": "Executive",
            "value": "executive"
         }
      ],
      "default": "any"
   },
   {
      "displayName": "Job Type",
      "name": "jobType",
      "description": "Filter by employment type",
      "type": "options",
      "options": [
         {
            "name": "Any (default)",
            "value": "any"
         },
         {
            "name": "Full-time",
            "value": "full_time"
         },
         {
            "name": "Part-time",
            "value": "part_time"
         },
         {
            "name": "Contract",
            "value": "contract"
         },
         {
            "name": "Temporary",
            "value": "temporary"
         },
         {
            "name": "Volunteer",
            "value": "volunteer"
         },
         {
            "name": "Internship",
            "value": "internship"
         }
      ],
      "default": "any"
   },
   {
      "displayName": "Posted within",
      "name": "postedWithin",
      "description": "Filter by when the job was posted",
      "type": "options",
      "options": [
         {
            "name": "Any time (default)",
            "value": "any"
         },
         {
            "name": "Past 24 hours",
            "value": "day"
         },
         {
            "name": "Past week",
            "value": "week"
         },
         {
            "name": "Past month",
            "value": "month"
         }
      ],
      "default": "any"
   },
   {
      "displayName": "Job Title",
      "name": "extractTitle",
      "description": "Extract job position title",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Company Name",
      "name": "extractCompany",
      "description": "Extract hiring company name",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Job Location",
      "name": "extractLocation",
      "description": "Extract job location",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Job Type",
      "name": "extractJobType",
      "description": "Full-time / Contract / etc.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Description Snippet",
      "name": "extractDescription",
      "description": "Extract job description preview",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Posted Date",
      "name": "extractDate",
      "description": "When the job was posted",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Company Logo",
      "name": "extractCompanyLogo",
      "description": "Include company logo URL",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Salary (raw)",
      "name": "extractSalary",
      "description": "Extract salary as shown on LinkedIn (free text). The parser turns this into salaryMinUsd / salaryMaxUsd / salaryMedianUsd.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Salary parser → USD",
      "name": "extractSalaryParse",
      "description": "Parse salary text into salaryMinUsd, salaryMaxUsd, salaryMedianUsd, salaryPeriod, salaryCurrency. Annualizes hourly/daily/weekly/monthly to year. Supports USD/EUR/GBP/CAD/AUD/INR/JPY.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Job freshness",
      "name": "extractFreshness",
      "description": "Convert 'Posted X days ago' into daysSincePosted + freshness_tier (today / this_week / this_month / older).",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Work mode classifier",
      "name": "extractWorkMode",
      "description": "Classify as remote / hybrid / onsite based on title + location + description signals.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Skills extraction",
      "name": "extractSkills",
      "description": "Extract skillsRequired[] (200+ tech terms), softSkills[], certifications[] from job title + description.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Benefits parser",
      "name": "extractBenefits",
      "description": "14 benefit boolean flags: mentions_401k, mentions_health_insurance, mentions_equity, mentions_remote_work, mentions_visa_sponsorship, mentions_relocation, mentions_unlimited_pto, mentions_parental_leave, mentions_signing_bonus, mentions_4_day_week, mentions_stipend, mentions_meals, mentions_gym, mentions_commuter_benefits.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Seniority normalizer",
      "name": "extractSeniority",
      "description": "Normalize the title into one of: intern / junior / mid / senior / lead / staff / principal / director / vp / c-level / unspecified.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Job category auto-detect",
      "name": "extractCategory",
      "description": "Auto-classify as engineering, data_science, product, design, sales, marketing, finance, hr, operations, legal, customer_support, healthcare, education, construction_trades, or other.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "recruiterScore (B2B prospecting)",
      "name": "extractRecruiterScore",
      "description": "0-100 composite score for recruitment-tech / ATS / sourcing-tool sales. Combines hiring activity (jobs in run for that company), job freshness, salary disclosure, modern skills, benefits depth, decision-maker seniority. Returned with leadTier (cold/warm/hot/scorching) + reasons.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Outreach assets",
      "name": "extractOutreachAssets",
      "description": "Build per-job outreachLinks: LinkedIn company page, LinkedIn hiring-manager people search, LinkedIn role-owner search (engineering manager / cmo / cfo / etc.), Google careers search, careers-page guess, mailto template. Plus per-company industry-specific outreach pitch with 3 variants (consultative / aggressive / referral) for A/B testing.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Diversity / DEI signals",
      "name": "extractDeiSignals",
      "description": "7 boolean flags: mentions_diversity, mentions_lgbtq, mentions_women, mentions_veteran_friendly, mentions_disability_friendly, mentions_eeo, mentions_pay_transparency. Useful for inclusive job boards, diversity recruiters, ESG audits.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Pay transparency law detection",
      "name": "extractPayTransparencyLaw",
      "description": "Detects if a US listing falls under a state/city pay-transparency law (CA, CO, CT, MD, NV, NY, RI, WA, DC, IL, MN, MA). Flags `pay_transparency_state` + `pay_transparency_compliant` (whether salary is disclosed as required by law). Compliance audit data for HR-tech.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Parse location into city/state/country",
      "name": "extractLocationParts",
      "description": "Parse `San Francisco, CA` → `city`, `state`, `country: US`, `isUsListing`, `isRemoteListing`. Used by pay-transparency detection and CRM filtering.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Deep-fetch every job (full description + salary)",
      "name": "deepFetchAll",
      "description": "Fetch each job's detail page for full description, salary, seniority, apply method, applicant count and industries. Adds ~1s/job with concurrent fetching. Strongly recommended.",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "Deep-fetch top N companies (legacy)",
      "name": "deepFetchTopN",
      "description": "Deep-fetch only top N companies by job count. Use deepFetchAll instead for full coverage. Set to 0 to disable.",
      "type": "number",
      "default": 0,
      "typeOptions": {
         "minValue": 0,
         "maxValue": 25
      }
   },
   {
      "displayName": "Keep only one job per company",
      "name": "deduplicateCompanies",
      "description": "If enabled, only the first job from each unique company is kept.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Min recruiterScore filter",
      "name": "minRecruiterScore",
      "description": "Drop jobs whose recruiterScore is below this value (0-100). Useful for high-intent prospect lists. 0 = no filter.",
      "type": "number",
      "default": 0,
      "typeOptions": {
         "minValue": 0,
         "maxValue": 100
      }
   },
   {
      "displayName": "Only jobs with disclosed salary",
      "name": "onlyWithSalary",
      "description": "Drop jobs where salary couldn't be parsed (no comp transparency).",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Only fully-remote jobs",
      "name": "onlyRemote",
      "description": "Drop hybrid / onsite / unknown work-mode jobs.",
      "type": "boolean",
      "default": false
   },
   {
      "displayName": "Export format",
      "name": "exportFormat",
      "description": "default = full JSON (all 30+ fields). csv = flattened sales-ready 25-column shape for HubSpot / Pipedrive / Salesforce import.",
      "type": "options",
      "options": [
         {
            "name": "Default JSON (all fields)",
            "value": "default"
         },
         {
            "name": "CSV (flattened, sales-ready)",
            "value": "csv"
         }
      ],
      "default": "default"
   },
   {
      "displayName": "Write SUMMARY + TOP_HIRING_COMPANIES + TOP_JOBS to KV store",
      "name": "writeSummary",
      "description": "On runs with multiple jobs, write three free aggregate records to the run's KV store: SUMMARY (avg salary, top skills, recruiter-tier distribution), TOP_HIRING_COMPANIES (top 20 companies sorted by job count with 3 outreach pitch variants), TOP_JOBS (top 20 jobs sorted by recruiterScore — sales-ops job-level digest).",
      "type": "boolean",
      "default": true
   },
   {
      "displayName": "TOP_HIRING_COMPANIES size",
      "name": "topCompaniesN",
      "description": "How many top companies to include in the TOP_HIRING_COMPANIES KV record.",
      "type": "number",
      "default": 20,
      "typeOptions": {
         "minValue": 5,
         "maxValue": 100
      }
   },
   {
      "displayName": "TOP_JOBS size",
      "name": "topJobsN",
      "description": "How many top jobs (sorted by recruiterScore) to include in the TOP_JOBS KV record.",
      "type": "number",
      "default": 20,
      "typeOptions": {
         "minValue": 5,
         "maxValue": 100
      }
   }
],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const body: Record<string, unknown> = {};
				body["keywords"] = this.getNodeParameter("keywords", i);
				body["location"] = this.getNodeParameter("location", i);
				body["maxPages"] = this.getNodeParameter("maxPages", i);
				body["remote"] = this.getNodeParameter("remote", i);
				body["experienceLevel"] = this.getNodeParameter("experienceLevel", i);
				body["jobType"] = this.getNodeParameter("jobType", i);
				body["postedWithin"] = this.getNodeParameter("postedWithin", i);
				body["extractTitle"] = this.getNodeParameter("extractTitle", i);
				body["extractCompany"] = this.getNodeParameter("extractCompany", i);
				body["extractLocation"] = this.getNodeParameter("extractLocation", i);
				body["extractJobType"] = this.getNodeParameter("extractJobType", i);
				body["extractDescription"] = this.getNodeParameter("extractDescription", i);
				body["extractDate"] = this.getNodeParameter("extractDate", i);
				body["extractCompanyLogo"] = this.getNodeParameter("extractCompanyLogo", i);
				body["extractSalary"] = this.getNodeParameter("extractSalary", i);
				body["extractSalaryParse"] = this.getNodeParameter("extractSalaryParse", i);
				body["extractFreshness"] = this.getNodeParameter("extractFreshness", i);
				body["extractWorkMode"] = this.getNodeParameter("extractWorkMode", i);
				body["extractSkills"] = this.getNodeParameter("extractSkills", i);
				body["extractBenefits"] = this.getNodeParameter("extractBenefits", i);
				body["extractSeniority"] = this.getNodeParameter("extractSeniority", i);
				body["extractCategory"] = this.getNodeParameter("extractCategory", i);
				body["extractRecruiterScore"] = this.getNodeParameter("extractRecruiterScore", i);
				body["extractOutreachAssets"] = this.getNodeParameter("extractOutreachAssets", i);
				body["extractDeiSignals"] = this.getNodeParameter("extractDeiSignals", i);
				body["extractPayTransparencyLaw"] = this.getNodeParameter("extractPayTransparencyLaw", i);
				body["extractLocationParts"] = this.getNodeParameter("extractLocationParts", i);
				body["deepFetchAll"] = this.getNodeParameter("deepFetchAll", i);
				body["deepFetchTopN"] = this.getNodeParameter("deepFetchTopN", i);
				body["deduplicateCompanies"] = this.getNodeParameter("deduplicateCompanies", i);
				body["minRecruiterScore"] = this.getNodeParameter("minRecruiterScore", i);
				body["onlyWithSalary"] = this.getNodeParameter("onlyWithSalary", i);
				body["onlyRemote"] = this.getNodeParameter("onlyRemote", i);
				body["exportFormat"] = this.getNodeParameter("exportFormat", i);
				body["writeSummary"] = this.getNodeParameter("writeSummary", i);
				body["topCompaniesN"] = this.getNodeParameter("topCompaniesN", i);
				body["topJobsN"] = this.getNodeParameter("topJobsN", i);
				const options: IRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`,
					body,
					json: true,
				};
				const response = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', options);
				const results = Array.isArray(response) ? response : [response];
				for (const result of results) returnData.push({ json: result, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [returnData];
	}
}
