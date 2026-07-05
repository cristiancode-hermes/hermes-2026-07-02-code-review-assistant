import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { BadgeComponent, BadgeVariant } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.debugElement.nativeElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the provided text', () => {
    fixture.componentRef.setInput('text', 'Critical');
    fixture.detectChanges();
    expect(nativeElement.textContent?.trim()).toBe('Critical');
  });

  it('should apply size classes for sm (default)', () => {
    fixture.componentRef.setInput('text', 'Bug');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-xs');
    expect(span?.className).toContain('px-2');
    expect(span?.className).toContain('py-0.5');
  });

  it('should apply size classes for md', () => {
    fixture.componentRef.setInput('text', 'Bug');
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-sm');
    expect(span?.className).toContain('px-2.5');
    expect(span?.className).toContain('py-1');
  });

  it('should render a dot when dot input is true', () => {
    fixture.componentRef.setInput('text', 'Online');
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    const dot = nativeElement.querySelector('span > span');
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain('rounded-full');
  });

  it('should not render a dot when dot input is false (default)', () => {
    fixture.componentRef.setInput('text', 'Offline');
    fixture.detectChanges();
    const dot = nativeElement.querySelector('span > span');
    expect(dot).toBeFalsy();
  });

  it('should apply variant-specific color classes for success', () => {
    fixture.componentRef.setInput('text', 'Passed');
    fixture.componentRef.setInput('variant', 'success');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-green-800');
    expect(span?.className).toContain('bg-green-100');
  });

  it('should apply variant-specific color classes for danger', () => {
    fixture.componentRef.setInput('text', 'Failed');
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-red-800');
    expect(span?.className).toContain('bg-red-100');
  });

  it('should apply variant-specific color classes for info', () => {
    fixture.componentRef.setInput('text', 'Info');
    fixture.componentRef.setInput('variant', 'info');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-indigo-800');
  });

  it('should apply variant-specific color classes for primary', () => {
    fixture.componentRef.setInput('text', 'Primary');
    fixture.componentRef.setInput('variant', 'primary');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-primary');
  });

  it('should apply variant-specific color classes for secondary', () => {
    fixture.componentRef.setInput('text', 'Secondary');
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-secondary');
  });

  it('should apply dot color matching the variant', () => {
    fixture.componentRef.setInput('text', 'Warning');
    fixture.componentRef.setInput('variant', 'warning');
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    const dot = nativeElement.querySelector('span > span') as HTMLElement | null;
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain('bg-amber-500');
  });

  it('should use the default variant color for unknown variants', () => {
    fixture.componentRef.setInput('text', 'Unknown');
    fixture.componentRef.setInput('variant', 'unknown' as BadgeVariant);
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-neutral-800');
  });

  it('should combine size and variant classes correctly', () => {
    fixture.componentRef.setInput('text', 'Mixed');
    fixture.componentRef.setInput('variant', 'warning');
    fixture.componentRef.setInput('size', 'md');
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('text-sm');
    expect(span?.className).toContain('bg-amber-100');
    expect(span?.className).toContain('text-amber-800');
    const dot = nativeElement.querySelector('span > span');
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain('bg-amber-500');
  });

  it('should render an inline-flex element', () => {
    fixture.componentRef.setInput('text', 'Flex');
    fixture.detectChanges();
    const span = nativeElement.querySelector('span');
    expect(span?.className).toContain('inline-flex');
  });
});
