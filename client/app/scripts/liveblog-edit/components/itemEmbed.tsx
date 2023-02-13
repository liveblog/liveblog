import React from 'react';
import { ItemEmbedRender } from './itemEmbedRender';

interface IProps {
    item: any;
}

export class ItemEmbed extends React.Component<IProps, IProps> {
    constructor(props) {
        super(props);

        this.state = { item: props.item };
    }

    /**
     * This is simply an exposed method to be able to update the item
     * value from the exterior. The reason is that Angular two-way binding
     * mechanism will not update the props of the component from outside so,
     * we need to do it manually.
     * @param nextItem
     */
    public updateItem(nextItem: any) {
        this.setState({ item: nextItem });
    }

    render() {
        const { item } = this.state;

        return (
            <div key={item.meta.original_url} className="item-embed-container">
                <ItemEmbedRender {...item.meta} text={item.text} />
            </div>
        );
    }
}
