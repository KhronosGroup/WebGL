<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="html"/>

<xsl:variable name="registry" select="document('registry.xml')/registry" />

<xsl:template match="*|@*|node()">
  <xsl:copy>
    <xsl:apply-templates select="*|@*|node()" />
  </xsl:copy>
</xsl:template>

<xsl:template match="extension|draft">
  <li value="{number}">
    <a href="{concat($registry/@href,@href)}"><xsl:value-of select="name" /></a>
  </li>
</xsl:template>

<xsl:template match="ol[@id='official-by-number']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/extension">
      <xsl:sort select="number" data-type="number" order="ascending"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='official-by-name']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/extension">
      <xsl:sort select="name"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='draft-by-number']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/draft">
      <xsl:sort select="number" data-type="number" order="ascending"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>

<xsl:template match="ol[@id='draft-by-name']">
  <xsl:copy>
    <xsl:apply-templates select="$registry/draft">
      <xsl:sort select="name"/>
    </xsl:apply-templates>
  </xsl:copy>
</xsl:template>
  
</xsl:stylesheet>
