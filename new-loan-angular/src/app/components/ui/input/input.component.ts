import { Component, Input, Output, EventEmitter, forwardRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      [type]="type"
      [value]="_value"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [class]="inputClasses"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  styles: []
})
export class InputComponent implements ControlValueAccessor, OnChanges {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() disabled = false;
  @Input() className = '';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  _value: string = '';
  onChange = (value: string) => {};
  onTouched = () => {};

  get inputClasses(): string {
    return cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      this.className
    );
  }

  ngOnChanges() {
    if (this.value !== undefined && this.value !== this._value) {
      this._value = this.value;
    }
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this._value = target.value;
    this.value = this._value; // Sync input property
    this.onChange(this._value);
    this.valueChange.emit(this._value);
  }

  onBlur() {
    this.onTouched();
  }

  writeValue(value: string): void {
    this._value = value || '';
    this.value = this._value; // Sync input property
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
