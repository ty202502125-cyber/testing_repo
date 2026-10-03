import nextActionDesk from './nextActionDesk';
import campusWeek from './campusWeek';
import serviceLedger from './serviceLedger';

/**
 * Layout registry.
 *
 * Each entry is a complete workspace presentation: it owns the student and
 * admin dashboards and declares how activity lists should be presented. Adding
 * a direction is a matter of adding one module here.
 */
const modules = [campusWeek, nextActionDesk, serviceLedger];

export const layouts = modules.reduce((accumulator, layout) => {
  accumulator[layout.id] = layout;
  return accumulator;
}, {});

export const layoutIds = modules.map((layout) => layout.id);

export const layoutOptions = modules.map(({ id, shortName, summary }) => ({ id, shortName, summary }));

export const defaultLayoutId = 'campusWeek';

export function getLayout(id) {
  return layouts[id] || layouts[defaultLayoutId];
}
