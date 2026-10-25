import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

export type TabId = 'home' | 'activities' | 'details' | 'profile';
export type IconName = ComponentProps<typeof Feather>['name'];
