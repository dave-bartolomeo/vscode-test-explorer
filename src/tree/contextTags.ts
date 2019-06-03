import { TestContext, TestContextProperty } from 'vscode-test-adapter-api';

/**
 * Creates a context string for a TreeView item from a {@link vscode-test-adapter-api#TestContext}
 * object.
 * 
 * @remarks The retured string contains a newline-separated sequence of tag identifiers. For each
 * `true` property in the context object or any of its descendants, there will be a tag identifier
 * of the form `a_b_c`, where `a.b.c` is the path to that property within the context object.
 *
 * @param context The context object from which to generate the tags.
 * @returns A string containing the tag identifiers, or `undefined` if the context object was
 * `undefined`.
 */
export function createContextTags(
	context: TestContext
): string | undefined {

	if (context) {
		const tags: string[] = [];
		collectContextTagsForObject(tags, '', context);
		return tags.join('\n');
	}
	else {
		return undefined;
	}
}

/**
 * Appends the tag identifier for each `true` property in the context object or any of its
 * descendants.
 * @param tags The array of tag identifiers to which the new tags should be appended.
 * @param prefix The scope prefix to prepend to each tag.
 * @param property The context object.
 */
function collectContextTagsForObject(
	tags: string[],
	prefix: string,
	property: TestContext
): void {

	for (const key in property) {
		collectContextTagsForProperty(tags, prefix + key, property[key]);
	}
}

/**
 * Appends the tag identifier for the specified property if its value is `true`.
 * @param tags The array of tag identifiers to which the new tags should be appended.
 * @param name The name of the property.
 * @param property The value of the property.
 */
function collectContextTagsForBoolean(
	tags: string[],
	name: string,
	property: boolean
): void {

	if (property) {
		tags.push(name);
	}
}

/**
 * Appends the tag identifier for each `true` property in the context object or any of its
 * descendants.
 * @param tags The array of tag identifiers to which the new tags should be appended.
 * @param name The name of the property.
 * @param property The value of the property.
 */
function collectContextTagsForProperty(
	tags: string[],
	name: string,
	property: TestContextProperty
): void {

	switch (typeof property) {
		case 'object':
			collectContextTagsForObject(tags, name + '_', property);
			break;

		case 'boolean':
			collectContextTagsForBoolean(tags, name, property);
			break;

		default:
			break;
	}
}
