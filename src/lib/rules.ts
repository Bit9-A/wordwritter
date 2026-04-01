import rulesData from '@/config/revision-rules.json';

export interface RevisionRule {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export function getRevisionRules(): RevisionRule[] {
  return rulesData.rules;
}

export function getRuleById(id: string): RevisionRule | undefined {
  return rulesData.rules.find(rule => rule.id === id);
}