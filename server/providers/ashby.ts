import type { Company, RawJob, Workplace } from "../../src/types";
import { fetchJson } from "../http";

interface AshbyPosting {
  id: string;
  title: string;
  teamId?: string | null;
  locationName?: string | null;
  workplaceType?: string | null;
  employmentType?: string | null;
}

interface AshbyBoardResponse {
  data?: {
    jobBoard: { teams: { id: string; name: string }[]; jobPostings: AshbyPosting[] } | null;
  };
}

const WORKPLACE: Record<string, Workplace> = { Remote: "remote", Hybrid: "hybrid", OnSite: "onsite" };

const EMPLOYMENT: Record<string, string> = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Intern: "Internship",
  Contract: "Contract",
  Temporary: "Temporary",
};

// The public posting API embeds every full description (13 MB for one big board); the job board's own
// GraphQL query returns the same listings without them. It has no posting date, so Ashby jobs have none.
const BOARD_QUERY = `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    teams { id name }
    jobPostings { id title teamId locationName workplaceType employmentType }
  }
}`;

export const fetchAshbyBoard = async (slug: string) => {
  const response = await fetchJson<AshbyBoardResponse>(
    "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationName: "ApiJobBoardWithTeams",
        variables: { organizationHostedJobsPageName: slug },
        query: BOARD_QUERY,
      }),
    },
  );
  return response.data?.jobBoard ?? null;
};

export const fetchAshbyJobs = async (company: Company): Promise<RawJob[]> => {
  const board = await fetchAshbyBoard(company.slug);
  if (!board) throw new Error(`Ashby board "${company.slug}" not found`);

  const teams = new Map(board.teams.map((team) => [team.id, team.name]));

  return board.jobPostings.map((posting) => ({
    id: `ashby:${posting.id}`,
    title: posting.title,
    company: company.name,
    provider: "ashby",
    department: (posting.teamId && teams.get(posting.teamId)) || undefined,
    employmentType: posting.employmentType ? (EMPLOYMENT[posting.employmentType] ?? posting.employmentType) : undefined,
    location: posting.locationName ?? "",
    workplace: WORKPLACE[posting.workplaceType ?? ""] ?? "unknown",
    url: `https://jobs.ashbyhq.com/${company.slug}/${posting.id}`,
  }));
};
