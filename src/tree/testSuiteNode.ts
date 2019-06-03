import * as vscode from 'vscode';
import { TestSuiteInfo, TestContext } from 'vscode-test-adapter-api';
import { TreeNode } from "./treeNode";
import { NodeState, stateIcon, parentNodeState, parentCurrentNodeState, parentPreviousNodeState, parentAutorunFlag } from "./state";
import { TestCollection } from './testCollection';
import { TestNode } from './testNode';
import { normalizeFilename } from '../util';
import { createContextTags } from './contextTags';

export class TestSuiteNode implements TreeNode {

	private _state: NodeState;
	private _children: TreeNode[];
	private description?: string;
	private tooltip?: string;

	readonly fileUri: string | undefined;
	private context: TestContext | undefined;
	uniqueId: string;
	get state(): NodeState { return this._state; }
	readonly log = undefined;
	get children(): TreeNode[] { return this._children; }

	/** set to true if one of the children's state may have changed and hence
	 *  the state of this node needs to be recalculated */
	recalcStateNeeded: boolean;

	/** set to true if the state, description or tooltip of this node has changed
	 *  and needs to be sent to VS Code so that the UI is updated */
	sendStateNeeded: boolean;

	constructor(
		public readonly collection: TestCollection,
		public readonly info: TestSuiteInfo,
		public readonly parent: TestSuiteNode | undefined,
		oldNodesById?: Map<string, TreeNode>
	) {

		this.fileUri = normalizeFilename(info.file);

		this.description = info.description;
		this.tooltip = info.tooltip;

		this._children = info.children.map(childInfo => {
			if (childInfo.type === 'test') {
				return new TestNode(collection, childInfo, this, oldNodesById);
			} else {
				return new TestSuiteNode(collection, childInfo, this, oldNodesById);
			}
		});

		this._state = parentNodeState(this._children);
	}

	update(description?: string, tooltip?: string) {
		if ((description !== undefined) && (description !== this.description)) {
			this.description = description;
			this.sendStateNeeded = true;
		}
		if ((tooltip !== undefined) && (tooltip !== this.tooltip)) {
			this.tooltip = tooltip;
			this.sendStateNeeded = true;
		}
	}

	recalcState(): void {

		for (const child of this.children) {
			if (child instanceof TestSuiteNode) {
				child.recalcState();
			}
		}

		if (this.recalcStateNeeded) {

			const newCurrentNodeState = parentCurrentNodeState(this.children);
			const newPreviousNodeState = parentPreviousNodeState(this.children);
			const newAutorunFlag = parentAutorunFlag(this.children);

			if ((this.state.current !== newCurrentNodeState) ||
				(this.state.previous !== newPreviousNodeState) ||
				(this.state.autorun !== newAutorunFlag)
			) {

				this.state.current = newCurrentNodeState;
				this.state.previous = newPreviousNodeState;
				this.state.autorun = newAutorunFlag;

				this.sendStateNeeded = true;
				if (this.parent) {
					this.parent.recalcStateNeeded = true;
				}

				if (this.fileUri) {
					this.collection.explorer.decorator.updateDecorationsFor(this.fileUri);
				}

			}

			this.recalcStateNeeded = false;
		}
	}

	retireState(): void {

		for (const child of this._children) {
			child.retireState();
		}

		this.recalcStateNeeded = true;
	}

	resetState(): void {

		if ((this.description !== this.info.description) || (this.tooltip !== this.info.tooltip)) {
			this.description = this.info.description;
			this.tooltip = this.info.tooltip;
			this.sendStateNeeded = true;
		}

		for (const child of this._children) {
			child.resetState();
		}

		this.recalcStateNeeded = true;
	}

	setAutorun(autorun: boolean): void {

		for (const child of this._children) {
			child.setAutorun(autorun);
		}

		this.recalcStateNeeded = true;
	}

	getTreeItem(): vscode.TreeItem {

		if (this.recalcStateNeeded) {
			this.recalcState();
		}
		this.sendStateNeeded = false;

		let label = this.info.label;
		if ((this.parent === undefined) && this.collection.adapter.workspaceFolder &&
			vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 1)) {
			label = `${this.collection.adapter.workspaceFolder.name} - ${label}`;
		}

		const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
		treeItem.id = this.uniqueId;
		treeItem.iconPath = this.collection.explorer.iconPaths[stateIcon(this.state)];
		if (this.context) {
			treeItem.contextValue = createContextTags(this.parent ? {
				suite: true,
				hasSource: this.fileUri ? true : false,
				ext: this.context
			} : {
				collection: true,
				ext: this.context
			});
		} else {
			treeItem.contextValue = this.parent ? (this.fileUri ? 'suiteWithSource' : 'suite') : 'collection';
		}
		treeItem.description = this.description;
		treeItem.tooltip = this.tooltip;

		return treeItem;
	}
}
