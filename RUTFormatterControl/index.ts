import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class RUTFormatterControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _inputElement: HTMLInputElement | null = null;
    private _messageElement: HTMLSpanElement | null = null;
    private _notifyOutputChanged?: () => void;
    private _formattedRut: string | undefined;
    private _cleanRut: string | undefined;
    private _isValid: boolean | undefined;

    /**
     * Used to initialize the control instance.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._notifyOutputChanged = notifyOutputChanged;
        const wrapper = document.createElement("div");
        wrapper.className = "rut-wrapper";

        const inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.placeholder = "12.345.678-9";
        inputElement.className = "rut-input";
        inputElement.addEventListener("input", this.handleInputChange);
        wrapper.appendChild(inputElement);

        const messageElement = document.createElement("span");
        messageElement.className = "rut-message";
        messageElement.style.display = "block";
        messageElement.style.fontSize = "0.8rem";
        messageElement.style.color = "#a4262c";
        messageElement.style.marginTop = "4px";
        messageElement.style.visibility = "hidden";
        wrapper.appendChild(messageElement);

        container.appendChild(wrapper);
        this._inputElement = inputElement;
        this._messageElement = messageElement;
        this.updateView(context);
    }

    /**
     * Called when any value in the property bag has changed.
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (!this._inputElement) {
            return;
        }

        this._inputElement.disabled = context.mode.isControlDisabled === true;
        const incomingValue = context.parameters.rutValue?.raw ?? "";
        const cleaned = this.cleanRut(incomingValue);
        this.applyValue(cleaned, true);
    }

    /**
     * Returns the formatted RUT value to the framework.
     */
    public getOutputs(): IOutputs {
        return {
            rutValue: this._cleanRut,
            rutIsValid: this._isValid
        };
    }

    /**
     * Cleanup listeners when the control is removed.
     */
    public destroy(): void {
        if (this._inputElement) {
            this._inputElement.removeEventListener("input", this.handleInputChange);
        }

        this._inputElement = null;
        this._messageElement = null;
    }

    private handleInputChange = (): void => {
        if (!this._inputElement) {
            return;
        }

        const cleaned = this.cleanRut(this._inputElement.value);
        this.applyValue(cleaned);
    };

    private applyValue(cleanedRut: string, suppressNotification = false): void {
        if (!this._inputElement) {
            return;
        }

        const formatted = cleanedRut ? this.formatRut(cleanedRut) : "";
        const formattedOrUndefined = formatted || undefined;
        const cleanedOrUndefined = cleanedRut || undefined;
        const validityFlag = cleanedRut.length === 0 ? true : this.isValidRut(cleanedRut);
        const hasValueChanged = cleanedOrUndefined !== this._cleanRut;
        const hasValidityChanged = validityFlag !== this._isValid;
        this._cleanRut = cleanedOrUndefined;
        this._formattedRut = formattedOrUndefined;
        this._isValid = validityFlag;

        if (this._inputElement.value !== (formattedOrUndefined ?? "")) {
            this._inputElement.value = formattedOrUndefined ?? "";
            if (document.activeElement === this._inputElement) {
                const caret = this._inputElement.value.length;
                this._inputElement.setSelectionRange(caret, caret);
            }
        }

        const isValid = cleanedRut.length === 0 || this.isValidRut(cleanedRut);
        const errorText = isValid ? "" : "RUT inválido - revise el dígito verificador";
        this._inputElement.setCustomValidity(isValid ? "" : errorText);
        this._inputElement.title = errorText;
        if (this._messageElement) {
            this._messageElement.textContent = errorText;
            this._messageElement.style.visibility = isValid ? "hidden" : "visible";
        }

        if ((hasValueChanged || hasValidityChanged) && !suppressNotification) {
            this._notifyOutputChanged?.();
        }
    }

    private cleanRut(value: string): string {
        return value.replace(/[^0-9kK]/g, "").toUpperCase();
    }

    private formatRut(cleanedRut: string): string {
        if (cleanedRut.length <= 1) {
            return cleanedRut;
        }

        const body = cleanedRut.slice(0, -1);
        const dv = cleanedRut.slice(-1);
        let formattedBody = "";
        let counter = 0;

        for (let idx = body.length - 1; idx >= 0; idx -= 1) {
            formattedBody = body.charAt(idx) + formattedBody;
            counter += 1;
            if (counter === 3 && idx !== 0) {
                formattedBody = "." + formattedBody;
                counter = 0;
            }
        }

        return `${formattedBody}-${dv}`;
    }

    private isValidRut(cleanedRut: string): boolean {
        if (cleanedRut.length < 2) {
            return false;
        }

        const body = cleanedRut.slice(0, -1);
        const dv = cleanedRut.slice(-1);
        let multiplier = 2;
        let sum = 0;

        for (let idx = body.length - 1; idx >= 0; idx -= 1) {
            sum += parseInt(body.charAt(idx), 10) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        const remainder = 11 - (sum % 11);
        const expectedDv = remainder === 11 ? "0" : remainder === 10 ? "K" : remainder.toString();
        return dv === expectedDv;
    }
}
