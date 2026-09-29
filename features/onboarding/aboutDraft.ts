export type Gender = 'male' | 'female' | 'unspecified';

/** Answers collected on About you before the places page can save them. */
export type AboutDraft = {
  screen: 'details' | 'languages';
  dateOfBirth: string;
  gender: Gender;
  showGender: boolean;
  languages: string[];
};

let draft: AboutDraft | null = null;

export function setAboutDraft(next: AboutDraft) {
  draft = next;
}

export function getAboutDraft(): AboutDraft | null {
  return draft;
}
