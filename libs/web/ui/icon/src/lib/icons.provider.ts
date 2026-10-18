import { inject, provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { ICONS } from './icons';

// a handful of inline icons instead of a 300 KB icon font
export function provideIcons(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const registry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    for (const { name, svg } of ICONS) {
      registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
    }
  });
}
