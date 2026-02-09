import { Component, Input, Output, EventEmitter, forwardRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <textarea
      [value]="_value"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [class]="textareaClasses"
      (input)="onInput($event)"
      (blur)="onBlur()"
    ></textarea>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  styles: []
})
export class TextareaComponent implements ControlValueAccessor, OnChanges {
  @Input() placeholder: string = '';
  @Input() disabled = false;
  @Input() className = '';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  _value: string = '';
  onChange = (value: string) => {};
  onTouched = () => {};

  get textareaClasses(): string {
    return cn(
      'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      this.className
    );
  }

  ngOnChanges() {
    if (this.value !== undefined && this.value !== this._value) {
      this._value = this.value;
    }
  }

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this._value = target.value;
    this.value = this._value;
    this.onChange(this._value);
    this.valueChange.emit(this._value);
  }

  onBlur() {
    this.onTouched();
  }

  writeValue(value: string): void {
    this._value = value || '';
    this.value = this._value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
