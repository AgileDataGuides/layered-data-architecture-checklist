import patternsJson from '$data/lookups/patterns.json';
import lookupsJson from '$data/lookups/lookups.json';
import dictionaryJson from '$data/lookups/dictionary.json';
import agileDataExample from '$data/architectures/agiledata-example.json';
import policiesJson from '$data/policies/policies.json';
import type { PatternsFile, Lookups, Dictionary, Checklist, PoliciesFile } from '$lib/types';

export const patternsFile = patternsJson as unknown as PatternsFile;
export const patterns = patternsFile.patterns;
export const lookups = lookupsJson as unknown as Lookups;
export const dictionary = dictionaryJson as unknown as Dictionary;
export const agileDataChecklist = agileDataExample as unknown as Checklist;
export const policiesFile = policiesJson as unknown as PoliciesFile;
export const defaultPolicies = policiesFile.policies;
export const defaultCategories = policiesFile.categories;
