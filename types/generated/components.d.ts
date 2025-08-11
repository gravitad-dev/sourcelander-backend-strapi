import type { Schema, Struct } from '@strapi/strapi';

export interface SeoShared extends Struct.ComponentSchema {
  collectionName: 'components_seo_shareds';
  info: {
    displayName: 'Shared';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    shareImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'seo.shared': SeoShared;
    }
  }
}
