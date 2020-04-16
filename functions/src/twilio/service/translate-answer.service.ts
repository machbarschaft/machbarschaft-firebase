export class TranslateAnswer {
    private readonly translatedAnswers: { [ key: string ]: string } = {
        groceries: "Einkaufen",
        medicine: "Apotheke",
        other: "sonstiges",
        asap: "sehr dringend",
        today: "heute",
        tomorrow: "morgen",
        yes: "ja",
        no: "nein"
    };

    getAnswer(key: string): string {
        return this.translatedAnswers[ key ];
    }
}
