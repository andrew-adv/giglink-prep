import { LearnerProgress } from './models/LearnerProgress.js';

function view(doc) {
  return doc ? { workspace: doc.workspace, revision: doc.revision, createdAt: new Date(doc.createdAt).toISOString(), updatedAt: new Date(doc.updatedAt).toISOString() } : null;
}

export function createProgressStore(Model = LearnerProgress) {
  return {
    async read(id) { return view(await Model.findById(id).lean().exec()); },
    async write(id, workspace, expectedRevision) {
      if (expectedRevision === 0) {
        try { return view(await Model.create({ _id: id, workspace, revision: 1 })); }
        catch (error) { if (error.code === 11000) return null; throw error; }
      }
      // The revision predicate and update are one atomic database operation.
      return view(await Model.findOneAndUpdate({ _id: id, revision: expectedRevision }, { $set: { workspace }, $inc: { revision: 1 } }, { new: true, runValidators: true }).lean().exec());
    },
  };
}
