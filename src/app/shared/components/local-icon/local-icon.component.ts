import { Component, Input } from '@angular/core';

/**
 * Dependency-free icon adapter for the incoming Manager and Inventory Manager
 * screens. The current application does not depend on lucide-angular, so this
 * preserves the incoming <lucide-angular> template contract without changing
 * the protected package files.
 */
@Component({
  selector: 'lucide-angular',
  standalone: true,
  template: '<span aria-hidden="true">{{ glyph }}</span>',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--local-icon-size);
      height: var(--local-icon-size);
      font-size: calc(var(--local-icon-size) * 0.75);
      line-height: 1;
    }
  `,
  host: {
    '[style.--local-icon-size]': 'normalizedSize',
    '[style.color]': 'color',
    '[attr.data-icon]': 'name',
  },
})
export class LocalIconComponent {
  @Input() name = 'circle';
  @Input() size: number | string = 24;
  @Input() strokeWidth: number | string = 2;
  @Input() color = 'currentColor';

  get normalizedSize(): string {
    return typeof this.size === 'number' ? `${this.size}px` : this.size;
  }

  get glyph(): string {
    return ICON_GLYPHS[this.name] || '•';
  }
}

const ICON_GLYPHS: Record<string, string> = {
  'arrow-down-wide-narrow': '↓',
  'arrow-up-narrow-wide': '↑',
  bell: '🔔',
  box: '▣',
  'clipboard-list': '☷',
  circle: '•',
  'message-circle': '○',
  package: '□',
  'rotate-ccw': '↺',
  star: '☆',
  'triangle-alert': '⚠',
  truck: '⇥',
  wrench: '⚒',
};
