import type { ComponentType } from 'react';
import type { ProfileStep } from '@crewup/shared';
import type { StepContext } from '../navigation';
import { AboutStep } from './AboutStep';
import { CrewIdentityStep } from './CrewIdentityStep';
import { NameHandleStep } from './NameHandleStep';
import { PhoneStep } from './PhoneStep';
import { PhotoStep } from './PhotoStep';
import { ResidenceStep } from './ResidenceStep';
import { ReviewStep } from './ReviewStep';

export const STEP_COMPONENTS: Record<ProfileStep, ComponentType<{ context: StepContext }>> = {
  name_handle: NameHandleStep,
  about: AboutStep,
  residence: ResidenceStep,
  crew: CrewIdentityStep,
  phone: PhoneStep,
  photo: PhotoStep,
  review: ReviewStep,
};

/** Sections editable from Settings → Edit profile (photo is edited inline there). */
export const EDITABLE_STEPS = ['name_handle', 'about', 'residence', 'crew', 'phone'] as const;
export type EditableStep = (typeof EDITABLE_STEPS)[number];

export { pickAndUploadAvatar } from './PhotoStep';
