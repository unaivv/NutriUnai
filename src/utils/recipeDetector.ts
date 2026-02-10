export const containsRecipe = (text: string): boolean => {
    const recipeKeywords = [
        'ingredientes',
        'preparación',
        'instrucciones',
        'pasos',
        'receta',
        'cocina',
        'calorías',
        'proteínas',
        'carbohidratos',
        'grasas',
        'nutrición',
        'plato',
        'comida'
    ];

    const lowerText = text.toLowerCase();

    // Check if text contains recipe-related keywords
    const hasKeywords = recipeKeywords.some(keyword => lowerText.includes(keyword));

    // Check if text has structure like a recipe (lists, numbered steps, etc.)
    const hasListStructure = /\d+\./.test(text) || /^\s*[-*•]/m.test(text);

    // Check if it mentions quantities or measurements
    const hasQuantities = /\d+\s*(g|kg|ml|l|cucharada|cucharadita|taza|pieza|porción)/i.test(text);

    return hasKeywords && (hasListStructure || hasQuantities);
};

export const extractRecipeTitle = (text: string): string => {
    // Remove HTML tags first
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const lines = cleanText.split('\n');

    // Look for titles in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();

        // Skip empty lines and very short lines
        if (line.length < 3) continue;

        // Look for lines that might be titles (not starting with numbers or bullets)
        if (!/^\d+/.test(line) && !/^[-*•]/.test(line)) {
            // Remove common prefixes
            const cleanTitle = line
                .replace(/^(receta|plato|comida):?\s*/i, '')
                .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
                .replace(/^\*|\*$/g, '') // Remove markdown italics
                .trim();

            if (cleanTitle.length > 3 && cleanTitle.length < 100) {
                return cleanTitle;
            }
        }
    }

    // If no clear title found, generate one
    const date = new Date().toLocaleDateString('es-ES');
    return `Receta del ${date}`;
};
