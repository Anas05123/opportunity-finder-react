import db from '../db/sqliteClient.js';
import { compileSearchConstraints } from '../services/constraintCompiler.js';
import { evaluateHardConstraints } from '../services/hardFilter.js';
import { classifyRoleFamily, matchRoleFamilyIntent } from '../services/roleFamilyClassifier.js';
import { classifyCompensation } from '../services/hardFilter.js';

console.log('====================================================');
console.log('DISCOVERY TRACE FOR "paid digital marketing internship in Kuala Lumpur"');
console.log('====================================================\n');

const query = 'paid digital marketing internship in Kuala Lumpur';
const constraints = compileSearchConstraints(query);

console.log('1. COMPILED CONSTRAINTS:');
console.log(JSON.stringify(constraints, null, 2));

// Fetch all from DB
const all = db.prepare(`
  SELECT * FROM opportunities 
  WHERE verification_status NOT IN ('DEAD', 'EXPIRED', 'CLOSED', 'verification_failed')
  ORDER BY source_authority_level ASC, confidence_score DESC
`).all();

console.log(`\n2. TOTAL ACTIVE OPPORTUNITIES IN DATABASE: ${all.length}`);

// Check which ones are in Malaysia / KL
const klOpps = all.filter(o => 
  (o.location_city && o.location_city.toLowerCase().includes('kuala lumpur')) ||
  (o.location_country && o.location_country.toLowerCase().includes('malaysia'))
);

console.log(`3. OPPORTUNITIES IN MALAYSIA / KL IN DB: ${klOpps.length}`);
console.log('   Positions in DB array:');
klOpps.forEach(o => {
  const idx = all.indexOf(o);
  console.log(`   [Index ${idx}] ${o.id} | ${o.title} | ${o.company} | City: ${o.location_city} | Country: ${o.location_country}`);
});

// Run hard filter on ALL opportunities in database
console.log('\n4. HARD FILTER EVALUATION ACROSS ENTIRE DB (900+ Records):');
let passedTotal = 0;
const passedList = [];
const rejectionStats = {
  wrong_location: 0,
  wrong_opportunity_type: 0,
  compensation_rejected: 0,
  role_rejected: 0,
  experience_rejected: 0
};

all.forEach(opp => {
  const res = evaluateHardConstraints(opp, constraints);
  if (res.is_eligible) {
    passedTotal++;
    passedList.push(opp);
  } else {
    res.failed_constraints.forEach(f => {
      if (f.constraint === 'LOCATION') rejectionStats.wrong_location++;
      if (f.constraint === 'OPPORTUNITY_TYPE') rejectionStats.wrong_opportunity_type++;
      if (f.constraint === 'COMPENSATION') rejectionStats.compensation_rejected++;
      if (f.constraint === 'ROLE_RELEVANCE') rejectionStats.role_rejected++;
      if (f.constraint === 'EXPERIENCE') rejectionStats.experience_rejected++;
    });
  }
});

console.log(`   Passed Hard Filter: ${passedTotal} / ${all.length}`);
console.log('   Rejection Breakdown:', rejectionStats);

if (passedList.length > 0) {
  console.log('\n5. SURVIVING OPPORTUNITIES:');
  passedList.forEach(p => {
    console.log(`   ✓ ${p.id} | ${p.title} | ${p.company} | ${p.location_city}, ${p.location_country} | Comp: ${p.stipend_text || p.salary_min}`);
  });
} else {
  console.log('\n5. EVALUATING WHY KL MARKETING OPPS WERE REJECTED:');
  klOpps.forEach(o => {
    const res = evaluateHardConstraints(o, constraints);
    console.log(`\n   OPPORTUNITY: ${o.id} - "${o.title}" (${o.company})`);
    console.log(`     Location: city="${o.location_city}", country="${o.location_country}", raw="${o.location_raw}"`);
    console.log(`     Type: "${o.opportunity_type}"`);
    console.log(`     Compensation: stipend="${o.stipend_text}", min="${o.salary_min}", is_paid=${o.is_paid}`);
    console.log(`     Comp Category: ${classifyCompensation(o)}`);
    console.log(`     Role Family: ${classifyRoleFamily(o.title)}`);
    console.log(`     Role Intent Match:`, matchRoleFamilyIntent(o.title, constraints.predicates.role_relevance.target_role_family));
    console.log(`     Hard Filter Result: is_eligible=${res.is_eligible}`);
    if (!res.is_eligible) {
      console.log(`     Failed Constraints:`, res.failed_constraints);
    }
  });
}
