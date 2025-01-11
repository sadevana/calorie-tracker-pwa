
/**
 * @template T
 * @param {string} id
 * @returns {T}
 */
export function getTypedElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id ${id} not found`);
    }
    return /** @type {T} */ (element);
}
