import { walkthroughs } from './walkthroughs.js';

export const closedGuide = { open: false, lessonId: 1, index: 0, choice: 'default' };

export function guideFrame(state) {
  const guide = walkthroughs.find(item => item.id === state.lessonId) || walkthroughs[0];
  const variant = guide.variants.find(item => item.id === state.choice) || guide.variants[0];
  const index = Math.max(0, Math.min(variant.steps.length - 1, state.index));
  return { guide, variant, step: variant.steps[index], index };
}

// Temporary demonstration state only. No storage or learner-workspace actions.
export function guideReducer(state, action) {
  if (action.type === 'open') {
    const guide = walkthroughs.find(item => item.id === action.lessonId);
    return guide ? { open: true, lessonId: guide.id, index: 0, choice: guide.variants[0].id } : state;
  }
  if (action.type === 'close') return { ...state, open: false };
  const { guide, variant, index } = guideFrame(state);
  if (action.type === 'next') return { ...state, index: Math.min(index + 1, variant.steps.length - 1) };
  if (action.type === 'back') return { ...state, index: Math.max(0, index - 1) };
  if (action.type === 'replay') return { ...state, index: 0 };
  if (action.type === 'choose') {
    const choice = guide.variants.find(item => item.id === action.choice);
    return choice ? { ...state, choice: choice.id, index: choice.choiceStep ?? 0 } : state;
  }
  return state;
}
