// The only place for unverified personal history. Do not infer identities from Git authors.
// Replace a value only after confirmation; change status/source accordingly, then review the story.
export const personalDetails = [
  { id: 'idea', label: 'Who first proposed the idea and when', status: 'To confirm', value: '', source: 'No conclusive repository evidence.' },
  { id: 'student1', label: 'Student 1 name and actual contributions', status: 'To confirm', value: '', source: 'Task assignment is not proof of personal authorship.' },
  { id: 'student2', label: 'Student 2 name and actual contributions', status: 'To confirm', value: '', source: 'Task assignment is not proof of personal authorship.' },
  { id: 'student3', label: 'Student 3 name and actual contributions', status: 'To confirm', value: '', source: 'Task assignment is not proof of personal authorship.' },
  { id: 'student4', label: 'Captain name and actual contributions', status: 'To confirm', value: '', source: 'Task assignment is not proof of personal authorship.' },
  { id: 'demo', label: 'Final demo date, instructor approval and live release result', status: 'To confirm', value: '', source: 'No verified final approval or live demonstration supplied.' },
];

export const foundationReport = {
  status: 'User-reported',
  text: 'The user reports that the instructor provided the initial C00 foundation. The Captain task document assigns C00 to Student 4. Those are different kinds of evidence; this story does not credit the student with supplying that foundation.',
};
