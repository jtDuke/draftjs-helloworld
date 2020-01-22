import React, { Component } from 'react';
import { Editor, EditorState, CompositeDecorator,
        RichUtils, convertToRaw, convertFromRaw,
        getDefaultKeyBinding 
} from 'draft-js';

import './RichEditor.css';

function Header(props) {
  console.log(props)
  return (
    <>
      { props.blockProps.elementType === 'header-one' ?     
        <div className='' style={{color: 'blue', fontFamily: 'roboto'}}>
            {props.blockProps.text}
        </div>
        : props.blockProps.elementType === 'header-two' ? 
          <div className='' style={{color: 'green', fontFamily: 'sans-serif'}}>
            {props.blockProps.text}
          </div>
        : null
      }
    </>
  );
}

export default class TestEditor extends Component {
    constructor(props) {
      super(props);

      // #region Links & Entities
      function findLinkEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges(
            (character) => {
            const entityKey = character.getEntity();
            return (
                entityKey !== null &&
                contentState.getEntity(entityKey).getType() === 'LINK'
            );
            },
            callback
        );
      }
      const Link = (props) => {
        const {url} = props.contentState.getEntity(props.entityKey).getData();
        return (
        //   <a href={url} style={styles.link}>
            <a href={url} >
            {props.children}
            </a>
        );
      };
      function findImageEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges(
            (character) => {
            const entityKey = character.getEntity();
            return (
                entityKey !== null &&
                contentState.getEntity(entityKey).getType() === 'IMAGE'
            );
            },
            callback
        );
      }
      const Image = (props) => {
        const {
            height,
            src,
            width,
        } = props.contentState.getEntity(props.entityKey).getData();

        return (
            <img src={src} height={height} width={width} />
        );
        
      };
      const decorator = new CompositeDecorator([
      {
          strategy: findLinkEntities,
          component: Link,
      },
      {
          strategy: findImageEntities,
          component: Image,
      },
      ]);
      // #endregion
      
      this.state = {
          editorState: EditorState.createWithContent(convertFromRaw(this.props.data), decorator),
      };
      this.focus = () => this.refs.editor.focus();
    }
    
    onChange = (editorState) => this.setState({editorState});
    logState = () => {
        const content = this.state.editorState.getCurrentContent();
        console.log(convertToRaw(content));
    };
  
    blockRendererFn = (contentBlock) => {
      const type = contentBlock.getType();
      if (type === 'header-one' || type === 'header-two') {
        return {
          component: Header,
          props: {
            text: contentBlock.getText(),
            elementType: type
          }
        };
      }
    }
    // #region Commands & Toggles
    _handleKeyCommand = (command, editorState) => {
      let newState = RichUtils.handleKeyCommand(editorState, command);
      
      if (!newState && command === 'strikethrough') {
        newState = RichUtils.toggleInlineStyle(this.state.editorState, 'STRIKETHROUGH');
      }

      if (newState) {
        this.onChange(newState);
        return true;
      }
      return false;
    }
    _mapKeyToEditorCommand = (e) => {
      if (e.keyCode === 9 /* TAB */) {
        const newEditorState = RichUtils.onTab(
          e,
          this.state.editorState,
          4, /* maxDepth */
        );
        if (newEditorState !== this.state.editorState) {
          this.onChange(newEditorState);
        }
        return;
      }
      return getDefaultKeyBinding(e);
    }
    _toggleBlockType = (blockType) =>{
      this.onChange(
        RichUtils.toggleBlockType(
          this.state.editorState,
          blockType
        )
      );
    }
    _toggleInlineStyle = (inlineStyle) =>{
      this.onChange(
        RichUtils.toggleInlineStyle(
          this.state.editorState,
          inlineStyle
        )
      );
    }
    // #endregion

    render() {
      const {editorState} = this.state;
      // If the user changes block type before entering any text, we can
      // either style the placeholder or hide it. Let's just hide it now.
      let className = 'RichEditor-editor';
      var contentState = editorState.getCurrentContent();
      if (!contentState.hasText()) {
        if (contentState.getBlockMap().first().getType() !== 'unstyled') {
          className += ' RichEditor-hidePlaceholder';
        }
      }
      return (
        <div className="row">
          <div className={''}>
              <div className="input-group-prepend">
                <input onClick={this.logState}
                    style={{
                        border: '1px solid #ccc', 
                        marginTop: '1rem', marginLeft: '4rem',
                        cursor: 'pointer', fontSize: '.8rem',
                        height: '2rem', backgroundColor: 'black', color: 'yellow'
                    }}
                    type="button"
                    value="Log State"
                />
              </div>
              <div className="RichEditor-root">
                <BlockStyleControls
                  editorState={editorState}
                  onToggle={this._toggleBlockType}
                />
                <InlineStyleControls
                  editorState={editorState}
                  onToggle={this._toggleInlineStyle}
                />
                <div className={className} onClick={this.focus}>
                  <Editor
                    blockStyleFn={getBlockStyle}
                    customStyleMap={styleMap}
                    editorState={editorState}
                    // blockRenderMap={extendedBlockRenderMap}
                    blockRendererFn={this.blockRendererFn}
                    handleKeyCommand={this.handleKeyCommand}
                    keyBindingFn={this.mapKeyToEditorCommand}
                    onChange={this.onChange}
                    placeholder="Tell a story..."
                    ref="editor"
                    spellCheck={true}
                  />
                </div>
              </div>
          </div>
        </div>
      );
    }
  }

  // Custom overrides for "code" style.
  const styleMap = {
    CODE: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
      fontSize: 16,
      padding: 2,
    },
    HIGHLIGHT: {
      backgroundColor: 'blue'
    }
  };
  function getBlockStyle(block) {
    // console.log('GETTING BLOCK TYPE...');
    // console.log(block.getType());
    switch (block.getType()) {
      case 'blockquote': return 'RichEditor-blockquote';
      case 'accolade': return 'RichEditor-accolade';
      default: return null;
    }
  }
  class StyleButton extends React.Component {
    constructor() {
      super();
      this.onToggle = (e) => {
        e.preventDefault();
        this.props.onToggle(this.props.style);
      };
    }
    render() {
      let className = 'RichEditor-styleButton';
      if (this.props.active) {
        className += ' RichEditor-activeButton';
      }
      return (
        <span className={className} onMouseDown={this.onToggle}>
          {this.props.label}
        </span>
      );
    }
  }
  const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
    {label: 'H2', style: 'header-two'},
    {label: 'H3', style: 'header-three'},
    {label: 'H4', style: 'header-four'},
    {label: 'H5', style: 'header-five'},
    {label: 'H6', style: 'header-six'},
    {label: 'Blockquote', style: 'blockquote'},
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'},
    {label: 'Code Block', style: 'code-block'},
    {label: 'Accolade', style: 'accolade'},
  ];
  const BlockStyleControls = (props) => {
    const {editorState} = props;
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    return (
      <div className="RichEditor-controls">
        {BLOCK_TYPES.map((type) =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
  };
  var INLINE_STYLES = [
    {label: 'Bold', style: 'BOLD'},
    {label: 'Italic', style: 'ITALIC'},
    {label: 'Underline', style: 'UNDERLINE'},
    {label: 'Monospace', style: 'CODE'},
    {label: 'Strikethrough', style: 'STRIKETHROUGH'},
    {label: 'Highlight', style: 'HIGHLIGHT'},
  ];
  const InlineStyleControls = (props) => {
    const currentStyle = props.editorState.getCurrentInlineStyle();
    
    return (
      <div className="RichEditor-controls">
        {INLINE_STYLES.map((type) =>
          <StyleButton
            key={type.label}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
  };