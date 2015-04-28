'use strict';
goog.provide('modules.shared.glsFboCompletenessTests');
goog.require('modules.shared.glsFboUtil');
goog.require('framework.common.tcuTestCase');


goog.scope(function() {

var glsFboCompletenessTests = modules.shared.glsFboCompletenessTests;
var glsFboUtil = modules.shared.glsFboUtil;
var tcuTestCase = framework.common.tcuTestCase;
    
    glsFboCompletenessTests.Context = function(argv) {

        argv = argv || {};
        
        // TestContext& testCtx, RenderContext& renderCtx, CheckerFactory& factory
        this._construct = function(argv) {
            this.m_testCtx    = argv.testCtx;
            this.m_renderCtx  = argv.renderCtx;
            this.m_minFormats = null;
            this.m_ctxFormats = null;
            this.m_maxFormats = null;
            this.m_verifier   = null;
            this.m_haveMultiColorAtts = false;
            
        //    FormatExtEntries extRange = GLS_ARRAY_RANGE(s_esExtFormats);
        //    addExtFormats(extRange);
        };
        
        // RenderContext&
        this.getRenderContext = function() { return this.m_renderCtx; };
        
        // TestContext&
        this.getTestContext   = function() { return this.m_testCtx; };
        
        // const FboVerifier&
        this.getVerifier      = function() { return this.m_verifier; };
        
        // const FormatDB&
        this.getMinFormats    = function() { return this.m_minFormats; };
        
        // const FormatDB&
        this.getCtxFormats    = function() { return this.m_ctxFormats; };
        
        // bool
        this.haveMultiColorAtts = function() { return this.m_haveMultiColorAtts; };
        this.setHaveMulticolorAtts = function(have) {
            this.m_haveMultiColorAtts = (have == true);
        }
        
        
        this.addFormats = function(fmtRange) {
            glsFboUtil.addFormats(this.m_minFormats, fmtRange);
            glsFboUtil.addFormats(this.m_ctxFormats, fmtRange);
            glsFboUtil.addFormats(this.m_maxFormats, fmtRange);
        };
        this.addExtFormats = function(extRange) {  };
        this.createRenderableTests = function() {  };
        this.createAttachmentTests = function() {  };
        this.createSizeTests = function() {  };
        
        /*
    						glsFboCompletenessTests.Context					(TestContext& testCtx,
													 RenderContext& renderCtx,
													 CheckerFactory& factory);
													 
	void					addFormats				(FormatEntries fmtRange);
	void					addExtFormats			(FormatExtEntries extRange);
	TestCaseGroup*			createRenderableTests	(void);
	TestCaseGroup*			createAttachmentTests	(void);
	TestCaseGroup*			createSizeTests			(void);
        //*/
        if (!argv.dont_construct) this._construct(argv);
    };
    
    glsFboCompletenessTests.TestBase = function(argv) {

        argv = argv || {};

        this.params = null;

        this.getContext = this.getState;

        this._construct = function(argv) {
            console.log("glsFboCompletenessTests.TestBase Constructor");
        };
        
        // GLenum attPoint, GLenum bufType
        this.getDefaultFormat = function(attPoint, bufType, gl_ctx) {
            gl_ctx = gl_ctx || gl;
            
            if (bufType == gl_ctx.NONE) {
                return glsFboUtil.ImageFormat.none();
            }
            
        };
        
        if (!argv.dont_construct) this._construct(argv);

    };
    glsFboCompletenessTests.TestBase.prototype = new tcuTestCase.DeqpTest();
    
    return {
        glsFboCompletenessTests.Context:  glsFboCompletenessTests.Context,
        glsFboCompletenessTests.TestBase: glsFboCompletenessTests.TestBase,
    }
    
});
