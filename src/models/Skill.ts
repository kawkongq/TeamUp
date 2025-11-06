import mongoose, { Document, Schema } from 'mongoose';

export interface ISkill extends Document {
  _id: string;
  name: string;
  category: string;
  icon?: string;
}

const SkillSchema = new Schema<ISkill>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
SkillSchema.index({ category: 1 });

export default mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);
