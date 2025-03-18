declare module 'shared_directory/config/mediaTypes' {
  export const mediaTypes: {
    [key: string]: {
      schema: Record<string, any>;
      frontendConfig: {
        fields: {
          [fieldName: string]: {
            type: string;
            required: boolean;
            options?: string[];
          };
        };
      };
    };
  };
}
