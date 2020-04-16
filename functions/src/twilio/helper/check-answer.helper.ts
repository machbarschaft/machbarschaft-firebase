export const checkSpeechResult = (result: string, possibleAnswer: string): boolean => {
    return result.toLocaleLowerCase().indexOf(possibleAnswer.toLocaleLowerCase()) !== -1
};
