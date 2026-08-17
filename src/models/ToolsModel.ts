/**
 * @file ToolsModel.ts
 * @description Model for the tools/tech-stack grid. Owns data, filter state, and filtering logic.
 */

import { toolsData, ToolItem, ToolCategory } from '@/data/tools';

export type { ToolItem, ToolCategory };

export const toolFilters = [
    { id: 'all', label: 'All' },
    { id: 'development', label: 'Development' },
    { id: 'design', label: 'Design' },
    { id: 'productivity', label: 'Productivity' }
];

export class ToolsModel {
    public readonly items: ToolItem[] = toolsData;
    private _currentFilter: ToolCategory | 'all' = 'all';

    public get currentFilter(): ToolCategory | 'all' {
        return this._currentFilter;
    }

    public setFilter(type: ToolCategory | 'all'): void {
        this._currentFilter = type;
    }

    public getFilteredItems(): ToolItem[] {
        if (this._currentFilter === 'all') return this.items;
        return this.items.filter(item => item.category === this._currentFilter);
    }
}
