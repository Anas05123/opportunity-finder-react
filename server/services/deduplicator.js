import db from '../db/database.js';

export function processAndDeduplicate(extractedOpportunities) {
  let newCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;

  for (const item of extractedOpportunities) {
    const slug = generateSlug(item.title);
    const { isNew } = db.upsertOpportunity({
      ...item,
      slug: slug
    });

    if (isNew) {
      newCount++;
    } else {
      updatedCount++;
      duplicateCount++;
    }
  }

  return { newCount, updatedCount, duplicateCount };
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
