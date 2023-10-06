export default function WrapViewCss(this: any, source: string): string {

    let filePath = this.resourcePath;
    let viewsFolderIndex = filePath.indexOf('/Views/');

    if (viewsFolderIndex > 0) {

        let controllerAction = filePath.slice(viewsFolderIndex + 7, filePath.length - 5).replace('/', '');

        let useRegEx = /@(use|forward).*?;/g;
        let useStatements = [...source.matchAll(useRegEx)].map(m => m[0]).join('\n');
        source = source.replace(useRegEx, '');

        return `${useStatements}\n.${controllerAction}{${source}}`;
    }
    
    return source;
    
}