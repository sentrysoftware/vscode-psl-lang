'use strict';
import * as vscode from 'vscode';

/**
 * Our activation function
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {

    // Registers our DocumentSymbolProvider
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(
        { language: "psl" }, new PslDocumentSymbolProvider()
    ));
}

/**
 * PslDocumentSymbolProvider
 * 
 * A class that lists all functions in a PSL source file, to display them in
 * VSCode's outline view.
 */
class PslDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Thenable<vscode.SymbolInformation[]> {

        return new Promise((resolve, reject) => {

            /**
             * List of symbols that will be returned 
             */
            var symbols = [];

            /**
             * Regex that detects lines with a function definition.
             * 
             * Limitation: The function declaration must be on one line, and there cannot
             * be anything else before it.
             */
            var functionPattern = /^\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;

            /**
             * Position of the last function found
             */
            var lastPosition = null;

            /**
             * Name of the last function found
             */
            var lastFunctionName = null;

            /**
             * (n-1)th line
             */
            var prevLine = null;

            // We'll go through each line and check whether it's a function definition
            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);
                var functionMatchArray = functionPattern.exec(line.text);
                if (functionMatchArray != null && functionMatchArray.length > 1) {

                    if (lastPosition != null && prevLine != null && lastFunctionName != null) {

                        // So this is a new function, which means we finished the previous one,
                        // so we add the previous one to the list, now that we know where it started
                        // and where it ends.
                        var functionRange = new vscode.Range(lastPosition, prevLine.range.start);
                        symbols.push({
                            name: lastFunctionName,
                            kind: vscode.SymbolKind.Function,
                            location: new vscode.Location(document.uri, functionRange),
                            containerName: ""
                        });
                    }

                    // Remember the position (and name) of this function, so we will add it to the list
                    // the next time we find the declaration of another function (thus corresponding to the
                    // end of this one)
                    lastFunctionName = functionMatchArray[1];
                    lastPosition = line.range.start;
                }
                prevLine = line;
            }

            // The last function definition needs to be added, from its position to the end of the document
            if (lastPosition != null && prevLine != null && lastFunctionName != null) {
                var functionRange = new vscode.Range(lastPosition, prevLine.range.end);
                symbols.push({
                    name: lastFunctionName,
                    kind: vscode.SymbolKind.Function,
                    location: new vscode.Location(document.uri, functionRange),
                    containerName: ""
                });
            }

            // Okay, return this list
            resolve(symbols);
        });
    }
}