import mongoose from 'mongoose';
import { validWorkspace } from '../../../shared/progress.mjs';

const { Schema } = mongoose;
// Only a SHA-256 digest of the bearer token is stored, never the credential.
const schema = new Schema({
  _id: { type: String, match: /^[a-f0-9]{64}$/ },
  workspace: { type: Schema.Types.Mixed, required: true, validate: validWorkspace },
  revision: { type: Number, required: true, min: 1 },
}, { timestamps: true, versionKey: false, bufferCommands: false, strict: 'throw' });

export const LearnerProgress = mongoose.model('LearnerProgress', schema);
