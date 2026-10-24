// Prize categories in a fixed order. Each category keeps its color in every chart
// (the CSS variable --cat-<key>), and stacks follow this order so neighboring
// colors are the pairs the palette was validated on.
export const CATEGORIES = [
  { name: 'Physics', key: 'physics', short: 'Physics' },
  { name: 'Chemistry', key: 'chemistry', short: 'Chemistry' },
  { name: 'Physiology or Medicine', key: 'medicine', short: 'Medicine' },
  { name: 'Literature', key: 'literature', short: 'Literature' },
  { name: 'Peace', key: 'peace', short: 'Peace' },
  { name: 'Economic Sciences', key: 'economics', short: 'Economics' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
export const SCIENCES = ['Physics', 'Chemistry', 'Physiology or Medicine'];
export const shortName = (name) => CATEGORIES.find((c) => c.name === name)?.short ?? name;
