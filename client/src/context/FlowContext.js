import React from 'react'
import randomstring from 'randomstring'

export const FlowContext = React.createContext(null)

export const FlowProvider = (props) => {
    const flowId = randomstring.generate()
    const initialNodes = [

    ];

    const initialEdges = [

    ]

    const [nodes, setNodes] = React.useState(initialNodes);
    const [edges, setEdges] = React.useState(initialEdges);

    const [data, setData] = React.useState({
        nodes: initialNodes,
        edges: initialEdges,
        title: "Untitled",
        flowId
    })

    return (
        <FlowContext.Provider value={{ data, setData, nodes, setNodes, edges, setEdges }}>
            {props.children}
        </FlowContext.Provider>
    )
}

