export const cleanString = (str) => {
    console.log('cleanString function called with:', str);
    const cleanedString = str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').trim();
    console.log('cleanedString result:', cleanedString);
    return cleanedString;
};

export const levenshteinDistance = (a, b) => {
    console.log('levenshteinDistance function called with:', a, b);
    const matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    console.log('levenshteinDistance result:', matrix[b.length][a.length]);
    return matrix[b.length][a.length];
};
