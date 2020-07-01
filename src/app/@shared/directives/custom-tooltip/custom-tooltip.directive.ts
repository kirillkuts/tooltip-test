import { ChangeDetectorRef, Directive, ElementRef, Inject, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { distinctUntilChanged, distinctUntilKeyChanged, filter, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

enum TOOLTIP_POSITION {
  TOP,
  BOTTOM,
}

const TOOLTIP_POSITION_OFFSET = 10;

@Directive( {
  selector: '[appCustomTooltip]'
} )
export class CustomTooltipDirective implements OnInit, OnDestroy {

  @Input() appCustomTooltip: string;

  private _tooltipInstance: any;
  private _showTooltip$: Subject<boolean> = new Subject<boolean>();
  private _destroy$: Subject<any> = new Subject<any>();

  constructor(
    public elementRef: ElementRef,
    private _renderer: Renderer2,
    private _cd: ChangeDetectorRef,
    @Inject( 'WINDOW' ) private _window: any,
    @Inject( DOCUMENT ) private _document: any
  ) {
  }

  /**
   * On init
   */
  ngOnInit() {
    this._subscribeToTooltipShowEvents();
    this._subscribeToTooltipHideEvents();

    this._subscribeToShowTooltip();
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _subscribeToTooltipShowEvents() {
    fromEvent( this.elementRef.nativeElement, 'click' ).pipe(
      takeUntil( this._destroy$ ),
      tap( _ => this._showTooltip$.next( true ) ),
    ).subscribe();
  }

  private _subscribeToTooltipHideEvents() {
    fromEvent( this._window, 'click' ).pipe(
      takeUntil( this._destroy$ ),
      filter( ( event: MouseEvent ) => !this.elementRef.nativeElement.contains( event.target ) && event.target !== this.elementRef.nativeElement ),
      tap( _ => this._showTooltip$.next( false ) ),
    ).subscribe();

    fromEvent( this._window, 'keydown' ).pipe(
      takeUntil( this._destroy$ ),
      filter( ( event: KeyboardEvent ) => event.keyCode === 27 ),
      tap( _ => this._showTooltip$.next( false ) ),
    ).subscribe();
  }

  private _subscribeToShowTooltip() {
    this._showTooltip$.pipe(
      takeUntil( this._destroy$ ),
      distinctUntilChanged(),
    ).subscribe( showTooltip => {
      if ( showTooltip ) {
        this._createTooltipInstance();
        this._renderer.appendChild( this._document.body, this._tooltipInstance );
      } else {
        if ( this._tooltipInstance ) {
          this._renderer.removeChild( this._document.body, this._tooltipInstance );
          this._tooltipInstance = null;
        }
      }

      this._subscribeToPageScroll();
    } );
  }

  private _subscribeToPageScroll() {
    // @ts-ignore
    fromEvent( this._window, 'scroll' ).pipe(
      takeUntil( merge(
        this._destroy$,
        this._showTooltip$.pipe( filter( showTooltip => !showTooltip ) ),
      ) ),

      map( ( res: Event ) => (res.target as Document).documentElement.scrollTop ),
      startWith( this._document.documentElement.scrollTop ),

      map( ( windowScrollTop: number ) => {
        const { top } = this.elementRef.nativeElement.getBoundingClientRect();
        const newTooltipPosition: TOOLTIP_POSITION = top - (this._tooltipInstance ? this._tooltipInstance.clientHeight : 0) - 50 < 0 ? TOOLTIP_POSITION.BOTTOM : TOOLTIP_POSITION.TOP;

        return {
          newTooltipPosition,
          windowScrollTop
        }
      } ),
      distinctUntilKeyChanged( 'newTooltipPosition' ),
      tap( res => this._repositionTooltip( res ) )
    ).subscribe();
  }

  private _repositionTooltip( arg: { newTooltipPosition: TOOLTIP_POSITION, windowScrollTop: number } ) {
    const { newTooltipPosition, windowScrollTop } = { ...arg };

    if ( this._tooltipInstance ) {
      const nativeElementClientRect = this.elementRef.nativeElement.getBoundingClientRect();
      const tooltipElementClientRect = this._tooltipInstance.getBoundingClientRect();

      let topPosition = nativeElementClientRect.y + windowScrollTop;

      switch ( newTooltipPosition ) {
        case TOOLTIP_POSITION.TOP:
          topPosition -= tooltipElementClientRect.height + TOOLTIP_POSITION_OFFSET;
          break;
        case TOOLTIP_POSITION.BOTTOM:
          topPosition += nativeElementClientRect.height + TOOLTIP_POSITION_OFFSET;
          break;
      }

      this._tooltipInstance.style.top = `${topPosition}px`;

      const widthDiff = tooltipElementClientRect.width - nativeElementClientRect.width;
      let leftPosition = nativeElementClientRect.left - widthDiff / 2;
      if ( leftPosition < 0 ) {
        leftPosition = 0;
      }

      if ( leftPosition + tooltipElementClientRect.width > this._document.documentElement.clientWidth ) {
        leftPosition = this._document.documentElement.clientWidth - tooltipElementClientRect.width;
      }

      this._tooltipInstance.style.left = `${leftPosition < 0 ? 0 : leftPosition}px`;
    }
  };

  private _createTooltipInstance() {
    this._tooltipInstance = this._document.createElement( 'div' );
    this._tooltipInstance.innerText = this.appCustomTooltip;

    this._tooltipInstance.setAttribute( 'aria-live', 'polite' );
    this._tooltipInstance.style.background = '#333';
    this._tooltipInstance.style.color = '#fff';
    this._tooltipInstance.style.borderRadius = '4px';
    this._tooltipInstance.style.fontSize = '14px';
    this._tooltipInstance.style.lineHeight = '1.4';
    this._tooltipInstance.style.pointerEvents = 'none';
    this._tooltipInstance.style.maxWidth = '350px';
    this._tooltipInstance.style.padding = '10px';
    this._tooltipInstance.style.display = 'inline-block';
    this._tooltipInstance.style.whiteSpace = 'nowrap';

    this._tooltipInstance.style.zIndex = '99999';
    this._tooltipInstance.style.position = 'absolute';
    this._tooltipInstance.style.left = '0px';
    this._tooltipInstance.style.top = '0px';
    this._tooltipInstance.style.right = 'auto';
    this._tooltipInstance.style.bottom = 'auto';
  }

}
