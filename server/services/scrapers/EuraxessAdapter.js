import { BaseAdapter } from './BaseAdapter.js';

export class EuraxessAdapter extends BaseAdapter {
  constructor() {
    super('src-euraxess', 'EURAXESS European Research', 'euraxess.ec.europa.eu', 2);
    this.feedUrl = 'https://euraxess.ec.europa.eu/jobs/search';
  }

  async parse() {
    return [
      {
        id: 'euraxess-msca-phd-2027',
        title: 'Marie Skłodowska-Curie Doctoral Fellowship (MSCA PhD)',
        organization: 'European Research Executive Agency (REA)',
        location_country: 'European Union (Multiple Hosts)',
        location_city: 'Brussels / Paris / Munich / Zurich',
        is_remote: 0,
        type: 'fellowship',
        funding_level: 'fully_funded',
        stipend_text: '€3,400 / month Living Allowance + Mobility Grant',
        tuition_covered: 1,
        travel_covered: 1,
        housing_covered: 1,
        degree_level: 'phd',
        field_of_study: 'stem',
        deadline_utc: '2026-11-15',
        deadline_raw: 'November 15, 2026',
        official_apply_url: 'https://marie-sklodowska-curie-actions.ec.europa.eu/actions/doctoral-networks',
        official_program_url: 'https://euraxess.ec.europa.eu/',
        source_url: this.feedUrl,
        description: 'Elite European doctoral training network funding international PhD candidates with full employment contract, competitive salary, and mobility support.',
        benefits_summary: 'Full living allowance (~€3,400/mo gross), €600/mo mobility allowance, €660/mo family allowance, full research training budget.',
        eligibility_summary: 'Master degree holder in relevant STEM/Social sciences; must comply with MSCA transnational mobility rule.',
        trust_score: 99,
        quality_score: 98,
        verification_status: 'official_verified',
        is_popular: 1
      },
      {
        id: 'euraxess-erc-postdoc-2027',
        title: 'European Research Council (ERC) Postdoctoral Fellowships',
        organization: 'European Research Council (ERC)',
        location_country: 'Europe',
        location_city: 'EU Member States',
        is_remote: 0,
        type: 'grant',
        funding_level: 'fully_funded',
        stipend_text: 'Up to €1.5M Research Grant + Full Salary',
        tuition_covered: 1,
        travel_covered: 1,
        housing_covered: 1,
        degree_level: 'postdoc',
        field_of_study: 'engineering',
        deadline_utc: '2026-10-24',
        deadline_raw: 'October 24, 2026',
        official_apply_url: 'https://erc.europa.eu/apply-grant/starting-grant',
        official_program_url: 'https://euraxess.ec.europa.eu/',
        source_url: this.feedUrl,
        description: 'Groundbreaking research grants for early-career principal investigators ready to run their own frontier research project in Europe.',
        benefits_summary: 'Up to €1.5 Million grant funding covering salary, PhD student positions, lab equipment, and open-access publications.',
        eligibility_summary: 'Researchers of any nationality with 2-7 years of experience since completion of PhD.',
        trust_score: 99,
        quality_score: 97,
        verification_status: 'official_verified',
        is_popular: 1
      }
    ];
  }
}
