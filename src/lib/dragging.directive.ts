import { Directive, effect, ElementRef, input, Renderer2 } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[ngxDragging]',
  standalone: true,
})
export class DraggingDirective {
  /** Emits on destroy for cleanup. */
  private destroyed$ = new Subject<void>();

  /** Enables/disables dragging. Default: true. */
  enableDragging = input<boolean>(true);

  /** Current horizontal scroll position. */
  scrollX = 0;

  /** Current vertical scroll position. */
  scrollY = 0;

  /** Initial horizontal cursor position. */
  oldX = 0;

  /** Initial vertical cursor position. */
  oldY = 0;

  /** Dragging state. */
  active = false;

  constructor(private element: ElementRef, private renderer: Renderer2) {
    effect(() => {
      console.log('enableDragging', this.enableDragging());
      this.enableDragging()
        ? this.initializeDragging()
        : this.destroyed$.next();
    });
  }

  private initializeDragging(): void {
    this.onMouseMove();
    this.onMouseLeave();
    this.onMouseUp();
    this.onMouseDown();
    this.onScroll();
  }

  /** Handles mousemove event for dragging. */
  private onMouseMove(): void {
    fromEvent(this.element.nativeElement, 'mousemove')
      .pipe(takeUntil(this.destroyed$))
      .subscribe((ev) => {
        const event = ev as MouseEvent;
        if (this.active && this.enableDragging()) {
          this.element.nativeElement.scroll(
            this.scrollX + (this.oldX - event.clientX),
            this.scrollY + (this.oldY - event.clientY)
          );
          this.oldX = event.clientX;
          this.oldY = event.clientY;
        }
      });
  }

  /** Stops dragging on mouseleave. */
  private onMouseLeave(): void {
    fromEvent(this.element.nativeElement, 'mouseleave')
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.resetDragging());
  }

  /** Stops dragging on mouseup. */
  private onMouseUp(): void {
    fromEvent(this.element.nativeElement, 'mouseup')
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.resetDragging());
  }

  /** Resets dragging state and cursor. */
  private resetDragging(): void {
    this.active = false;
    this.renderer.setStyle(document.body, 'cursor', 'default');
  }

  /** Starts dragging on mousedown. */
  private onMouseDown(): void {
    fromEvent(this.element.nativeElement, 'mousedown')
      .pipe(takeUntil(this.destroyed$))
      .subscribe((ev) => {
        const event = ev as MouseEvent;
        if (this.enableDragging()) {
          this.active = true;
          this.oldX = event.clientX;
          this.oldY = event.clientY;
          this.renderer.setStyle(document.body, 'cursor', 'move');
        }
      });
  }

  /** Updates scroll positions on scroll. */
  private onScroll(): void {
    fromEvent(this.element.nativeElement, 'scroll')
      .pipe(takeUntil(this.destroyed$))
      .subscribe((ev) => {
        const event = ev as Event;
        if (this.enableDragging()) {
          const { scrollTop, scrollLeft } = event.target as HTMLElement;
          this.scrollX = scrollLeft;
          this.scrollY = scrollTop;
        }
      });
  }

  /** Cleans up subscriptions on destroy. */
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
