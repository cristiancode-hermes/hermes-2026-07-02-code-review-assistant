import { Component, input } from '@angular/core';
import { DiffFile } from '../../services/api.service';

@Component({
  selector: 'app-diff-side-by-side',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <!-- Header -->
      <div class="grid grid-cols-2 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium">
        <div class="px-4 py-2 text-neutral-500 bg-neutral-50 dark:bg-neutral-750 border-r border-neutral-200 dark:border-neutral-700">Base</div>
        <div class="px-4 py-2 text-neutral-500 bg-neutral-50 dark:bg-neutral-750">New</div>
      </div>

      <!-- Lines -->
      @for (hunk of file().hunks; track hunk.id) {
        <div>
          <!-- Hunk header -->
          <div class="px-4 py-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-750 border-b border-neutral-200 dark:border-neutral-700">
            @@ -{{ hunk.oldStart }},{{ hunk.oldLines }} +{{ hunk.newStart }},{{ hunk.newLines }} @@
          </div>

          @for (line of hunk.lines; track $index) {
            <div class="grid grid-cols-2">
              <!-- Left (base) -->
              <div
                class="flex border-r border-neutral-200 dark:border-neutral-700"
                [class]="lineStyleLeft(line)"
              >
                <span class="w-12 flex-shrink-0 text-right px-2 py-0.5 text-xs font-mono text-neutral-400 dark:text-neutral-500 select-none border-r border-neutral-200 dark:border-neutral-700">
                  {{ line.type !== 'addition' ? line.oldNumber ?? '' : '' }}
                </span>
                <span class="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre overflow-x-auto">{{ line.type !== 'addition' ? line.content : '' }}</span>
              </div>

              <!-- Right (new) -->
              <div
                class="flex"
                [class]="lineStyleRight(line)"
              >
                <span class="w-12 flex-shrink-0 text-right px-2 py-0.5 text-xs font-mono text-neutral-400 dark:text-neutral-500 select-none border-r border-neutral-200 dark:border-neutral-700">
                  {{ line.type !== 'deletion' ? line.newNumber ?? '' : '' }}
                </span>
                <span class="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre overflow-x-auto">{{ line.type !== 'deletion' ? line.content : '' }}</span>
                @if (line.hasFinding) {
                  <button class="px-2 flex items-center text-xs text-danger hover:text-red-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DiffSideBySideComponent {
  readonly file = input.required<DiffFile>();

  protected lineStyleLeft(line: { type: string; hasFinding: boolean }): string {
    if (line.type === 'deletion') return 'bg-red-50 dark:bg-red-900/10';
    if (line.type === 'addition') return '';
    return '';
  }

  protected lineStyleRight(line: { type: string; hasFinding: boolean }): string {
    if (line.type === 'addition') return 'bg-green-50 dark:bg-green-900/10';
    if (line.type === 'deletion') return '';
    return '';
  }
}
