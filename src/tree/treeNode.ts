import * as vscode from 'vscode';
import { NodeState } from './state';
import { TestCollection } from './testCollection';
import { TestSuiteNode } from './testSuiteNode';
import { TestTreeNode } from 'vscode-test-adapter-api';

export interface TreeNode extends TestTreeNode {
	readonly fileUri: string | undefined;
	uniqueId: string;
	readonly state: NodeState;
	sendStateNeeded: boolean;
	readonly log: string | undefined;
	readonly collection: TestCollection;
	readonly parent: TestSuiteNode | undefined;
	readonly children: TreeNode[];
	retireState(): void;
	resetState(): void;
	setAutorun(autorun: boolean): void;
	getTreeItem(): vscode.TreeItem;
}
