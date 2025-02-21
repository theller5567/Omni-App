const helpers = {
    generateSlug(title: string, id: string): string {
        return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
    }
}

export default helpers;