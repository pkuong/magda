import React from "react";
import debouncePromise from "debounce-promise";
import ASyncCreatableSelect from "react-select/async-creatable";

import ReactSelectStyles from "../Common/react-select/ReactSelectStyles";
import CustomMultiValueRemove from "../Common/react-select/CustomMultiValueRemove";

type SelectData = {
    value: string;
    label: string;
};

interface MultiSelectAutocomplete<T> {
    placeHolderText?: string;
    value?: T[] | undefined;
    onChange: (value?: T[]) => void;
    query?: (string: string) => Promise<T[]>;
    toData: (value: T) => SelectData;
    fromData: (value: SelectData) => T;
}

export default function MultiSelectAutoComplete<T>(
    props: MultiSelectAutocomplete<T>
) {
    const loadOptions = props.query
        ? debouncePromise(async (inputValue: string) => {
              const options = await props.query!(inputValue);
              return options.map(props.toData);
          }, 200)
        : () => Promise.resolve([]);

    return (
        <ASyncCreatableSelect
            className="react-select"
            isMulti={true}
            isSearchable={true}
            noOptionsMessage={x =>
                props.query ? "Type to enter a new option" : "No Options"
            }
            components={{
                MultiValueRemove: CustomMultiValueRemove
            }}
            onChange={(values, action) => {
                props.onChange(
                    Array.isArray(values)
                        ? values.map(props.fromData)
                        : undefined
                );
            }}
            styles={ReactSelectStyles}
            value={props.value && props.value.map(props.toData)}
            loadOptions={loadOptions}
            placeholder={props.placeHolderText}
        />
    );
}
