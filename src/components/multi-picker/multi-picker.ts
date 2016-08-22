import { AfterContentInit, Component, EventEmitter, forwardRef, HostListener, Input, OnDestroy, Optional, Output, Provider, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// import { Config } from '../../config/config';
import { Picker, PickerController, Form, Item, IONIC_DIRECTIVES } from 'ionic-angular';
// import { PickerColumn, PickerColumnOption } from '../picker/picker-options';
// import { dateValueRange, renderDateTime, renderTextFormat, convertFormatToKey, getValueFromFormat, parseTemplate, parseDate, updateDate, DateTimeData, convertDataToISO, daysInMonth, dateSortValue, dateDataSortValue, LocaleData } from 'ionic-angular';

// export const DATETIME_VALUE_ACCESSOR = new Provider(
//     NG_VALUE_ACCESSOR, {useExisting: forwardRef(() => DateTime), multi: true});



@Component({
   selector: 'ion-multi-picker',
   template: `
    <div class="multi-picker-text" >{{_text}}</div>
    <button 
            category="item-cover"
            class="item-cover item-cover-default" 
            aria-haspopup="true"
            type="button"
            [id]="id"
            [attr.aria-labelledby]="_labelId"
            [attr.aria-disabled]="_disabled">
            <span class="botton-inener">
            </span>
            <ion-button-effect></ion-button-effect>
    </button>
  `,
   host: {
      '[class.multi-picke-disabled]': '_disabled'
   },
   directives: [IONIC_DIRECTIVES],
   // providers: [DATETIME_VALUE_ACCESSOR],
   encapsulation: ViewEncapsulation.None,
})
export class MultiPicker implements AfterContentInit, ControlValueAccessor, OnDestroy {
   private _disabled: any = false;
   private _labelId: string = "90";
   private _text: string = '';
   private _fn: Function;
   private _isOpen: boolean = false;
   private _value: string = '';

  /**
   * @private
   */
   id: string;

   columns: any[] = [];

  /**
   * @input {string} The text to display on the picker's cancel button. Default: `Cancel`.
   */
   @Input() cancelText: string = 'Cancel';

  /**
   * @input {string} The text to display on the picker's "Done" button. Default: `Done`.
   */
   @Input() doneText: string = 'Done';

   @Input() multiPickerOptions: any[] = [{
      text: 'text1', value: 'value1', options: [
         { text: 'text1-1', value: 'value1-1', options: [{ text: 'text1-1-1', value: 'value1-1-1' }, { text: 'text1-1-2', value: 'value1-1-2' }] },
         { text: 'text1-2', value: 'value1-2', options: [{ text: 'text1-2-1', value: 'value1-2-1' }, { text: 'text1-2-2', value: 'value1-2-2' }] }]
   },
      {
         text: 'text2', value: 'value2', options: [
            { text: 'text2-1', value: 'value2-1', options: [{ text: 'text2-1-1', value: 'value2-1-1' }, { text: 'text2-1-2', value: 'value2-1-2' }] },
            { text: 'text2-2', value: 'value2-2', options: [{ text: 'text2-2-1', value: 'value2-2-1' }, { text: 'text2-2-2', value: 'value2-2-2' }] },
            { text: 'text2-3', value: 'value2-3', options: [{ text: 'text2-3-1', value: 'value2-3-1' }, { text: 'text2-3-2', value: 'value2-3-2' }] }]
      }];

   // @Input() pickerOptions: any = {};

  /**
   * @output {any} Any expression to evaluate when the datetime selection has changed.
   */
   @Output() ionChange: EventEmitter<any> = new EventEmitter();

  /**
   * @output {any} Any expression to evaluate when the datetime selection was cancelled.
   */
   @Output() ionCancel: EventEmitter<any> = new EventEmitter();

   constructor(
      private _form: Form,
      // private _config: Config,
      @Optional() private _item: Item,
      @Optional() private _pickerCtrl: PickerController
   ) {
      this._form.register(this);
      if (_item) {
         this.id = 'dt-' + _item.registerInput('multi-picker');
         this._labelId = 'lbl-' + _item.id;
         this._item.setCssClass('item-multi-picker', true);
      }
   }

   @HostListener('click', ['$event'])
   private _click(ev: UIEvent) {
      if (ev.detail === 0) {
         // do not continue if the click event came from a form submit
         return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      this.open();
   }

   @HostListener('keyup.space')
   private _keyup() {
      if (!this._isOpen) {
         this.open();
      }
   }

  /**
   * @private
   */
   open() {
      if (this._disabled) {
         return;
      }

      console.debug('datetime, open picker');

      // the user may have assigned some options specifically for the alert
      let pickerOptions: any = {};

      let picker = this._pickerCtrl.create(pickerOptions);
      pickerOptions.buttons = [
         {
            text: this.cancelText,
            role: 'cancel',
            handler: () => {
               this.ionCancel.emit(null);
            }
         },
         {
            text: this.doneText,
            handler: (data: any) => {
               console.log('datetime, done', data);
               this.onChange(data);
               this.ionChange.emit(data);
            }
         }
      ];

      this.generate(picker);
      for (let i = 0; i < picker.getColumns().length; i++) {
         this.validate(picker);
      }

      picker.ionChange.subscribe(() => {
         this.validate(picker);
      });

      picker.present(pickerOptions);

      this._isOpen = true;
      picker.onDidDismiss(() => {
         this._isOpen = false;
      });
   }

  /**
   * @private
   */
   generate(picker: Picker) {
      if (this.columns.length === 0) {
         this.generateColums(this.multiPickerOptions, 0);
      }
      for (let column of this.columns) {
         picker.addColumn(column);
      }

      this.divyColumns(picker);
   }

   generateColums(options: any[], level: any) {
      let column = this.columns.find(column => column.name === level.toString());
      if (!column) {
         column = {
            selectedIndex: 0,
            name: level.toString(),
            options: []
         }
         this.columns.push(column);
      }

      for (let option of options) {
         column.options.push({ text: option.text, value: option.value, disabled: false });
         if (option.options) {
            this.generateColums(option.options, level + 1)
         }
      }
   }

  /**
   * @private
   */
    validate(picker: Picker) {
      let columns = picker.getColumns();
      let preOption;
      let multiPickerOptions = this.multiPickerOptions;
      for (let column of columns) {
         let columnChanged: boolean = false;
         if (column.name != '0' && preOption) {
            let multiPickerOption = multiPickerOptions.find(option => option.value === preOption.value);
            for (let option of column.options) {
               let disabled = multiPickerOption.options.findIndex(subOption => subOption.value === option.value) === -1;
               if (option.disabled != disabled) {
                  option.disabled = disabled;
                  columnChanged = true;
               }
               if (option.disabled) {

               }
            }
            if (columnChanged) {
               // column.selectedIndex = column.options.findIndex(option => option.value === multiPickerOption.options[0].value);
               break;
            }
            multiPickerOptions = multiPickerOption.options;
         }
         preOption = column.options[column.selectedIndex];
      }

      picker.refresh();
    }

  /**
   * @private
   */
    divyColumns(picker: Picker) {
      let pickerColumns = picker.getColumns();
      let columns: number[] = [];

      pickerColumns.forEach((col, i) => {
         columns.push(0);

         col.options.forEach(opt => {
            if (opt.text.length > columns[i]) {
               columns[i] = opt.text.length;
            }
         });

      });

      if (columns.length === 2) {
         var width = Math.max(columns[0], columns[1]);
         pickerColumns[0].columnWidth = pickerColumns[1].columnWidth = `${width * 16}px`;

      } else if (columns.length === 3) {
         var width = Math.max(columns[0], columns[2]);
         pickerColumns[1].columnWidth = `${columns[1] * 16}px`;
         pickerColumns[0].columnWidth = pickerColumns[2].columnWidth = `${width * 16}px`;

      } else if (columns.length > 3) {
         columns.forEach((col, i) => {
            pickerColumns[i].columnWidth = `${col * 12}px`;
         });
      }
    }

   //   /**
   //    * @private
   //    */
    setValue(newData: any) {
      console.log(newData);
      // updateDate(this._value, newData);
    }

   //   /**
   //    * @private
   //    */
    getValue(): string {
      return this._value;
    }

   //   /**
   //    * @private
   //    */
    checkHasValue(inputValue: any) {
      if (this._item) {
         this._item.setCssClass('input-has-value', !!(inputValue && inputValue !== ''));
      }
    }

    /**
     * @private
     */
    updateText() {
      this._text = this._value.replace('_', ' ');
      // create the text of the formatted data
      // this._text = renderDateTime(this.displayFormat, this._value, this._locale);
    }

    /**
     * @input {boolean} Whether or not the datetime component is disabled. Default `false`.
     */
    @Input()
    get disabled() {
      return this._disabled;
    }

    set disabled(val: boolean) {
      this._disabled = val;
      this._item && this._item.setCssClass('item-datetime-disabled', this._disabled);
    }

    /**
     * @private
     */
    writeValue(val: any) {
        console.debug('datetime, writeValue', val);
        this.setValue(val);
        this.updateText();
        this.checkHasValue(val);
    }

    /**
     * @private
     */
    ngAfterContentInit() {
        // first see if locale names were provided in the inputs
        // then check to see if they're in the config
        // if neither were provided then it will use default English names
        // ['monthNames', 'monthShortNames', 'dayNames', 'dayShortNames'].forEach(type => {
        //   this._locale[type] = convertToArrayOfStrings(isPresent(this[type]) ? this[type] : this._config.get(type), type);
        // });

        // update how the datetime value is displayed as formatted text
        this.updateText();
    }

    /**
     * @private
     */
    registerOnChange(fn: Function): void {
        this._fn = fn;
        this.onChange = (val: any) => {
         console.debug('datetime, onChange', val);
         this.setValue(val);
         this.updateText();
         this.checkHasValue(val);

         // convert DateTimeData value to iso datetime format
         // fn(convertDataToISO(this._value));
         this.onTouched();
        };
    }

    /**
     * @private
     */
   registerOnTouched(fn: any) { this.onTouched = fn; }

    /**
     * @private
     */
   onChange(val: any) {
      // onChange used when there is not an formControlName
      console.debug('datetime, onChange w/out formControlName', val);
      this.setValue(val);
      this.updateText();
      this.onTouched();
   }

    /**
     * @private
     */
   onTouched() { }

    /**
     * @private
     */
   ngOnDestroy() {
      this._form.deregister(this);
   }
   // }

   // /**
   //  * @private
   //  * Use to convert a string of comma separated numbers or
   //  * an array of numbers, and clean up any user input
   //  */
   // function convertToArrayOfNumbers(input: any, type: string): number[] {
   //   var values: number[] = [];

   //   if (isString(input)) {
   //     // convert the string to an array of strings
   //     // auto remove any whitespace and [] characters
   //     input = input.replace(/\[|\]|\s/g, '').split(',');
   //   }

   //   if (isArray(input)) {
   //     // ensure each value is an actual number in the returned array
   //     input.forEach((num: any) => {
   //       num = parseInt(num, 10);
   //       if (!isNaN(num)) {
   //         values.push(num);
   //       }
   //     });
   //   }

   //   if (!values.length) {
   //     console.warn(`Invalid "${type}Values". Must be an array of numbers, or a comma separated string of numbers.`);
   //   }

   //   return values;
   // }

   // /**
   //  * @private
   //  * Use to convert a string of comma separated strings or
   //  * an array of strings, and clean up any user input
   //  */
   // function convertToArrayOfStrings(input: any, type: string): string[] {
   //   if (isPresent(input)) {
   //     var values: string[] = [];

   //     if (isString(input)) {
   //       // convert the string to an array of strings
   //       // auto remove any [] characters
   //       input = input.replace(/\[|\]/g, '').split(',');
   //     }

   //     if (isArray(input)) {
   //       // trim up each string value
   //       input.forEach((val: any) => {
   //         val = val.trim();
   //         if (val) {
   //           values.push(val);
   //         }
   //       });
   //     }

   //     if (!values.length) {
   //       console.warn(`Invalid "${type}Names". Must be an array of strings, or a comma separated string.`);
   //     }

   //     return values;
   //   // }
}
